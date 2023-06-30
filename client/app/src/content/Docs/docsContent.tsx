import { createContext } from "react";
interface Doc {
        user: string;
        title: string;
        content:string;
        _id: string;
        date: string;
        __v: number;
      }
interface DocsContentContextType{
        docs:Doc[];
        emptyDoc:()=>void;
        addDoc:(title:string,roomId:string)=>void;
        getDoc:()=>void;
        deleteDoc:(id:string)=>void;
}

const DocsContent = createContext<DocsContentContextType>({} as DocsContentContextType);


export default DocsContent;
