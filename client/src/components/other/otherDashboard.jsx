// client/src/components/other/otherDashboard.jsx
import React, { useContext } from "react";
import { AuthContext } from "../../main";
import ProfileDashboard from "../common/ProfileDashboard";

const OtherDashboard = () => {
  const { user, API, logout } = useContext(AuthContext);
  
  return (
    <ProfileDashboard 
      userType="other" 
      user={user} 
      API={API} 
      logout={logout} 
    />
  );
};

export default OtherDashboard;