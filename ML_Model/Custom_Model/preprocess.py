import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif
from sklearn.utils import resample
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

class CustomDataPreprocessor:
    def __init__(self):
        self.preprocessor = None
        self.label_encoder = None
        self.feature_selector = None
        self.selected_features = None
        self.numeric_features = None
        self.categorical_features = None
        self.target_column = None
        self.feature_columns = None
        
    def analyze_dataset(self, df, target_column=None):
        """Analyze the dataset and auto-detect structure"""
        print("🔍 Analyzing dataset structure...")
        
        # Auto-detect target column if not provided
        if target_column is None:
            # Look for common target column names
            possible_targets = ['target', 'class', 'label', 'disposition', 'tfopwg_disp', 'koi_disposition']
            for col in possible_targets:
                if col in df.columns:
                    target_column = col
                    print(f"🎯 Auto-detected target column: {target_column}")
                    break
            
            # If still not found, use the last column
            if target_column is None:
                target_column = df.columns[-1]
                print(f"🎯 Using last column as target: {target_column}")
        
        self.target_column = target_column
        
        # Separate features and target
        feature_columns = [col for col in df.columns if col != target_column]
        self.feature_columns = feature_columns
        
        # Identify numeric and categorical features
        self.numeric_features = df[feature_columns].select_dtypes(include=[np.number]).columns.tolist()
        self.categorical_features = df[feature_columns].select_dtypes(exclude=[np.number]).columns.tolist()
        
        print(f"📊 Dataset Analysis:")
        print(f"   - Total samples: {len(df)}")
        print(f"   - Features: {len(feature_columns)}")
        print(f"   - Numeric features: {len(self.numeric_features)}")
        print(f"   - Categorical features: {len(self.categorical_features)}")
        print(f"   - Target column: {target_column}")
        
        # Target distribution
        target_counts = df[target_column].value_counts()
        print(f"🎯 Target distribution:")
        for value, count in target_counts.items():
            percentage = (count / len(df)) * 100
            print(f"   - {value}: {count} ({percentage:.1f}%)")
        
        return feature_columns
    
    def create_preprocessing_pipeline(self):
        """Create dynamic preprocessing pipeline based on data types"""
        print("🔧 Creating preprocessing pipeline...")
        
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        
        # Only include transformers for features that exist
        transformers = []
        if self.numeric_features:
            transformers.append(('num', numeric_transformer, self.numeric_features))
        if self.categorical_features:
            transformers.append(('cat', categorical_transformer, self.categorical_features))
        
        if transformers:
            self.preprocessor = ColumnTransformer(transformers=transformers)
        else:
            raise ValueError("No valid features found for preprocessing")
        
        print(f"✅ Preprocessing pipeline created with {len(transformers)} transformers")
    
    def preprocess_data(self, df, target_column=None):
        """Complete preprocessing for custom dataset"""
        # Analyze dataset
        feature_columns = self.analyze_dataset(df, target_column)
        
        # Separate features and target
        X = df[feature_columns]
        y = df[self.target_column]
        
        # Handle missing target values
        mask = y.notna()
        X = X[mask]
        y = y[mask]
        
        # Encode target labels
        self.label_encoder = LabelEncoder()
        y_encoded = self.label_encoder.fit_transform(y)
        
        print("🎯 Label encoding summary:")
        unique_classes = np.unique(y_encoded)
        for class_idx in unique_classes:
            class_name = self.label_encoder.inverse_transform([class_idx])[0]
            count = (y_encoded == class_idx).sum()
            percentage = (count / len(y_encoded)) * 100
            print(f"   {class_name}: {count} samples ({percentage:.1f}%)")
        
        # Create and fit preprocessing pipeline
        self.create_preprocessing_pipeline()
        X_processed = self.preprocessor.fit_transform(X)
        
        # Get feature names after preprocessing
        feature_names = []
        if self.numeric_features:
            feature_names.extend(self.numeric_features)
        if self.categorical_features:
            # Get one-hot encoded feature names
            ct = self.preprocessor.named_transformers_['cat']
            onehot = ct.named_steps['onehot']
            cat_features = onehot.get_feature_names_out(self.categorical_features)
            feature_names.extend(cat_features)
        
        # Feature selection
        if len(feature_names) > 10:
            k = min(15, len(feature_names))
            self.feature_selector = SelectKBest(score_func=f_classif, k=k)
            X_selected = self.feature_selector.fit_transform(X_processed, y_encoded)
            self.selected_features = [feature_names[i] for i in self.feature_selector.get_support(indices=True)]
            print(f"✅ Selected top {k} features from {len(feature_names)} total features")
        else:
            X_selected = X_processed
            self.selected_features = feature_names
            print(f"✅ Using all {len(feature_names)} features")
        
        # Handle class imbalance
        X_balanced, y_balanced = self.handle_class_imbalance(X_selected, y_encoded)
        
        return X_balanced, y_balanced
    
    def handle_class_imbalance(self, X, y):
        """Handle class imbalance using SMOTE-like manual resampling"""
        print("⚖️ Handling class imbalance...")
        
        # Convert to DataFrame for easier manipulation
        if hasattr(X, 'toarray'):
            X_df = pd.DataFrame(X.toarray())
        else:
            X_df = pd.DataFrame(X)
        X_df['target'] = y
        
        # Find the majority class count
        class_counts = X_df['target'].value_counts()
        max_count = class_counts.max()
        min_count = class_counts.min()
        
        print("📈 Class distribution before resampling:")
        for class_idx, count in class_counts.items():
            class_name = self.label_encoder.inverse_transform([class_idx])[0]
            print(f"   {class_name}: {count} samples")
        
        # Only resample if significant imbalance exists
        imbalance_ratio = max_count / min_count if min_count > 0 else float('inf')
        
        if imbalance_ratio > 2:  # Only resample if imbalance is significant
            resampled_dfs = []
            for class_idx in class_counts.index:
                class_df = X_df[X_df['target'] == class_idx]
                n_samples = len(class_df)
                
                if n_samples < max_count:
                    # Upsample minority class
                    resampled_class = resample(
                        class_df,
                        replace=True,
                        n_samples=max_count,
                        random_state=42
                    )
                    resampled_dfs.append(resampled_class)
                    print(f"   🔼 Upsampled {self.label_encoder.inverse_transform([class_idx])[0]} from {n_samples} to {max_count}")
                else:
                    resampled_dfs.append(class_df)
            
            # Combine all resampled data
            X_resampled_df = pd.concat(resampled_dfs, ignore_index=True)
            X_resampled = X_resampled_df.drop('target', axis=1).values
            y_resampled = X_resampled_df['target'].values
            
            print("📊 Class distribution after resampling:")
            unique, counts = np.unique(y_resampled, return_counts=True)
            for class_idx, count in zip(unique, counts):
                class_name = self.label_encoder.inverse_transform([class_idx])[0]
                print(f"   {class_name}: {count} samples")
                
            return X_resampled, y_resampled
        else:
            print("📊 Class distribution is balanced, no resampling needed")
            return X, y
    
    def preprocess_single_sample(self, sample_data):
        """Preprocess a single sample for prediction"""
        if self.preprocessor is None:
            raise ValueError("Preprocessor not fitted. Train the model first.")
        
        # Convert to DataFrame
        sample_df = pd.DataFrame([sample_data])
        
        # Ensure all expected columns are present
        for col in self.feature_columns:
            if col not in sample_df.columns:
                sample_df[col] = np.nan if col in self.numeric_features else 'missing'
        
        # Reorder columns to match training data
        sample_df = sample_df[self.feature_columns]
        
        # Apply preprocessing
        sample_processed = self.preprocessor.transform(sample_df)
        
        # Apply feature selection if used
        if self.feature_selector:
            sample_processed = self.feature_selector.transform(sample_processed)
        
        return sample_processed
    
    def save_preprocessor(self, file_path):
        """Save preprocessor objects"""
        try:
            preprocessor_data = {
                'preprocessor': self.preprocessor,
                'label_encoder': self.label_encoder,
                'feature_selector': self.feature_selector,
                'selected_features': self.selected_features,
                'numeric_features': self.numeric_features,
                'categorical_features': self.categorical_features,
                'feature_columns': self.feature_columns,
                'target_column': self.target_column
            }
            joblib.dump(preprocessor_data, file_path)
            print(f"✅ Custom Preprocessor saved to {file_path}")
        except Exception as e:
            print(f"❌ Error saving custom preprocessor: {e}")
            raise
    
    def load_preprocessor(self, file_path):
        """Load preprocessor objects"""
        preprocessor_data = joblib.load(file_path)
        self.preprocessor = preprocessor_data['preprocessor']
        self.label_encoder = preprocessor_data['label_encoder']
        self.feature_selector = preprocessor_data['feature_selector']
        self.selected_features = preprocessor_data['selected_features']
        self.numeric_features = preprocessor_data['numeric_features']
        self.categorical_features = preprocessor_data['categorical_features']
        self.feature_columns = preprocessor_data['feature_columns']
        self.target_column = preprocessor_data['target_column']
        print(f"✅ Custom Preprocessor loaded from {file_path}")