import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.utils import resample
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

class KOIDataPreprocessor:
    def __init__(self):
        self.imputer = None
        self.scaler = None
        self.label_encoder = None
        self.feature_selector = None
        self.selected_features = None
        
        # Define feature columns based on KOI dataset structure
        self.feature_columns = [
            'koi_period', 'koi_impact', 'koi_duration', 'koi_depth',
            'koi_prad', 'koi_teq', 'koi_insol', 'koi_model_snr',
            'koi_steff', 'koi_slogg', 'koi_srad', 'koi_kepmag'
        ]
        
        # KOI has multiple disposition columns - using koi_disposition as primary target
        self.target_column = 'koi_disposition'
        
    def load_and_clean_data(self, file_path):
        """Load and clean the KOI dataset"""
        try:
            print(f"📖 Loading KOI dataset from {file_path}...")
            # Read CSV with comment character
            df = pd.read_csv(file_path, comment='#', low_memory=False)
            print(f"✅ Loaded KOI dataset with {len(df)} rows and {len(df.columns)} columns")
            
            # Display available columns for debugging
            print(f"📊 Available columns: {len(df.columns)}")
            print(f"🔍 First few columns: {list(df.columns)[:15]}...")
            
            # Select only relevant columns that exist in the dataset
            available_features = [col for col in self.feature_columns if col in df.columns]
            missing_features = [col for col in self.feature_columns if col not in df.columns]
            
            if missing_features:
                print(f"⚠️  Missing features: {missing_features}")
            
            # Handle target column - KOI has multiple disposition columns
            target_columns = ['koi_disposition', 'koi_pdisposition']
            self.target_column = None
            for target_col in target_columns:
                if target_col in df.columns:
                    self.target_column = target_col
                    print(f"🔍 Using target column: {self.target_column}")
                    break
            
            if not self.target_column:
                raise ValueError(f"No target column found. Available columns: {list(df.columns)}")
            
            df = df[available_features + [self.target_column]]
            print(f"✅ Selected {len(available_features)} features and target column '{self.target_column}'")
            
            # Clean target column - handle different formats
            df[self.target_column] = df[self.target_column].astype(str).str.strip().str.upper()
            
            # Remove rows with missing target or invalid target values
            initial_count = len(df)
            df = df[df[self.target_column].notna()]
            df = df[df[self.target_column] != 'NAN']
            df = df[df[self.target_column] != '']
            df = df[df[self.target_column] != 'UNKNOWN']
            
            removed_count = initial_count - len(df)
            if removed_count > 0:
                print(f"🗑️  Removed {removed_count} rows with missing/invalid target values")
            
            # Handle infinite values
            df = df.replace([np.inf, -np.inf], np.nan)
            
            print(f"📊 Final dataset size: {len(df)} rows")
            print(f"🎯 Target value counts:")
            target_counts = df[self.target_column].value_counts()
            for value, count in target_counts.items():
                print(f"   {value}: {count} samples ({count/len(df)*100:.1f}%)")
            
            return df
            
        except Exception as e:
            print(f"❌ Error loading KOI data: {e}")
            raise
    
    def handle_missing_values(self, df):
        """Handle missing values in the dataset"""
        print("🔧 Handling missing values...")
        
        # Separate features and target
        X = df[self.feature_columns].copy()
        y = df[self.target_column].copy()
        
        # Print missing values summary
        missing_summary = X.isnull().sum()
        total_missing = missing_summary.sum()
        print(f"📊 Total missing values: {total_missing}")
        
        if total_missing > 0:
            print("📋 Missing values per column:")
            for col, missing_count in missing_summary.items():
                if missing_count > 0:
                    percentage = (missing_count / len(X)) * 100
                    print(f"   {col}: {missing_count} ({percentage:.1f}%)")
        
        # Impute missing values - use median for numerical features
        self.imputer = SimpleImputer(strategy='median')
        X_imputed = self.imputer.fit_transform(X)
        X_imputed = pd.DataFrame(X_imputed, columns=X.columns, index=X.index)
        
        return X_imputed, y
    
    def encode_labels(self, y):
        """Encode target labels"""
        self.label_encoder = LabelEncoder()
        y_encoded = self.label_encoder.fit_transform(y)
        
        print("🎯 Label encoding summary:")
        unique_classes = np.unique(y_encoded)
        for class_idx in unique_classes:
            class_name = self.label_encoder.inverse_transform([class_idx])[0]
            count = (y_encoded == class_idx).sum()
            percentage = (count / len(y_encoded)) * 100
            print(f"   {class_name}: {count} samples ({percentage:.1f}%)")
            
        return y_encoded
    
    def feature_selection(self, X, y):
        """Perform feature selection"""
        print("🔍 Performing feature selection...")
        
        # Remove constant features
        constant_features = X.columns[X.nunique() <= 1]
        if len(constant_features) > 0:
            print(f"   Removing constant features: {list(constant_features)}")
            X = X.drop(columns=constant_features)
        
        # Remove highly correlated features
        corr_matrix = X.corr().abs()
        upper_triangle = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
        high_corr_features = [column for column in upper_triangle.columns if any(upper_triangle[column] > 0.95)]
        
        if high_corr_features:
            print(f"   Removing highly correlated features: {high_corr_features}")
            X = X.drop(columns=high_corr_features)
        
        # Use SelectKBest for feature selection
        k = min(10, len(X.columns))  # Select top 10 features or all if less than 10
        self.feature_selector = SelectKBest(score_func=f_classif, k=k)
        X_selected = self.feature_selector.fit_transform(X, y)
        
        # Get selected feature names and scores
        selected_mask = self.feature_selector.get_support()
        self.selected_features = X.columns[selected_mask].tolist()
        feature_scores = self.feature_selector.scores_[selected_mask]
        
        print(f"✅ Selected {len(self.selected_features)} features with scores:")
        for feature, score in zip(self.selected_features, feature_scores):
            print(f"   - {feature}: {score:.2f}")
            
        return X_selected
    
    def scale_features(self, X):
        """Scale features using StandardScaler"""
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        return X_scaled
    
    def handle_class_imbalance(self, X, y):
        """Handle class imbalance using manual resampling"""
        print("⚖️ Handling class imbalance...")
        
        # Convert to DataFrame for easier manipulation
        X_df = pd.DataFrame(X)
        X_df['target'] = y
        
        # Find the majority class count
        class_counts = X_df['target'].value_counts()
        max_count = class_counts.max()
        
        print("📈 Class distribution before resampling:")
        for class_idx, count in class_counts.items():
            class_name = self.label_encoder.inverse_transform([class_idx])[0]
            print(f"   {class_name}: {count} samples")
        
        # Resample each minority class
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
    
    def preprocess_pipeline(self, file_path):
        """Complete preprocessing pipeline"""
        # Load and clean data
        df = self.load_and_clean_data(file_path)
        
        # Handle missing values
        X, y = self.handle_missing_values(df)
        
        # Encode labels
        y_encoded = self.encode_labels(y)
        
        # Feature selection
        X_selected = self.feature_selection(X, y_encoded)
        
        # Scale features
        X_scaled = self.scale_features(X_selected)
        
        # Handle class imbalance
        X_resampled, y_resampled = self.handle_class_imbalance(X_scaled, y_encoded)
        
        return X_resampled, y_resampled
    
    def preprocess_single_sample(self, sample_data):
        """Preprocess a single sample for prediction"""
        if self.imputer is None or self.scaler is None or self.feature_selector is None:
            raise ValueError("Preprocessor not fitted. Call preprocess_pipeline first.")
        
        # Convert to DataFrame
        sample_df = pd.DataFrame([sample_data])
        
        # Select only the features we need
        available_features = [col for col in self.feature_columns if col in sample_df.columns]
        sample_df = sample_df[available_features]
        
        # Add missing columns with NaN
        for col in self.feature_columns:
            if col not in sample_df.columns:
                sample_df[col] = np.nan
        
        # Reorder columns to match training data
        sample_df = sample_df[self.feature_columns]
        
        # Impute missing values
        sample_imputed = self.imputer.transform(sample_df)
        sample_imputed = pd.DataFrame(sample_imputed, columns=sample_df.columns)
        
        # Feature selection
        sample_selected = self.feature_selector.transform(sample_imputed)
        
        # Scale features
        sample_scaled = self.scaler.transform(sample_selected)
        
        return sample_scaled
    
    def save_preprocessor(self, file_path):
        """Save preprocessor objects"""
        try:
            preprocessor_data = {
                'imputer': self.imputer,
                'scaler': self.scaler,
                'label_encoder': self.label_encoder,
                'feature_selector': self.feature_selector,
                'selected_features': self.selected_features,
                'feature_columns': self.feature_columns,
                'target_column': self.target_column
            }
            joblib.dump(preprocessor_data, file_path)
            print(f"✅ KOI Preprocessor saved to {file_path}")
        except Exception as e:
            print(f"❌ Error saving KOI preprocessor: {e}")
            raise
    
    def load_preprocessor(self, file_path):
        """Load preprocessor objects"""
        preprocessor_data = joblib.load(file_path)
        self.imputer = preprocessor_data['imputer']
        self.scaler = preprocessor_data['scaler']
        self.label_encoder = preprocessor_data['label_encoder']
        self.feature_selector = preprocessor_data['feature_selector']
        self.selected_features = preprocessor_data['selected_features']
        self.feature_columns = preprocessor_data['feature_columns']
        self.target_column = preprocessor_data['target_column']
        print(f"✅ KOI Preprocessor loaded from {file_path}")