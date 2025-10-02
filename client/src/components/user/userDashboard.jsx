import React, { useContext } from "react";
import { AuthContext } from "../../main";
import ProfileDashboard from "../common/ProfileDashboard";

const UserDashboard = () => {
  // Pass only the necessary context values to the generic ProfileDashboard
  const { user, API, logout } = useContext(AuthContext); 
  
  return (
    <ProfileDashboard 
      userType="user" 
      user={user} 
      API={API} 
      logout={logout} 
    />
  );
};

export default UserDashboard;
