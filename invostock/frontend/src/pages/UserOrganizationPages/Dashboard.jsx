import { useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    console.log("Trenutni user u state-u:", user);
  }, [user]);
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Dobrodošao, {user?.name}!</p>
    </div>
  );
};

export default Dashboard;
