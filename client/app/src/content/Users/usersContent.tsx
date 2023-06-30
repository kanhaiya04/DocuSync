import { createContext } from "react";

export interface User {
        _id: string;
        name: string;
        email: string;
        password: string;
        Docs: string[]; 
        date: string;
        __v: number;
      }
      
interface UsersContentContextType{
        users:User[];
        getUser:()=>void;
        
}

const userContext = createContext<UsersContentContextType>({} as UsersContentContextType);



export default userContext;