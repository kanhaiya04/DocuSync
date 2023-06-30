import userContext from "./usersContent";
import { User } from "./usersContent";
import React, { ReactNode, useState } from "react";
const host = "http://localhost:5000";
const configStore = (window as any).configStore;
interface UsersStateProps {
  children: ReactNode;
}


const UserState: React.FC<UsersStateProps> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);

  const getUser =async ()=>{
    const respones  = await fetch(`${host}/user/getuser`,{
      method: 'GET',
      headers:{
        "content-type": "application/json",
        "token":configStore.getSecret(),
      }
    })
    const json = await respones.json();
    const arr=[json.response];
    if(JSON.stringify(arr)!==JSON.stringify(users)){
      setUsers(arr)
    }
  }
  return <userContext.Provider value={{users, getUser}}>{children}</userContext.Provider>;
};

export default UserState;
