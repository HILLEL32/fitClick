import { createContext, useState } from "react";

// createContext({}) האובייקט בפנים נכניס את כל המשתנים
// פונצקיות גלובליות כדי שנקבל השלמות
export const AppContext = createContext({
  studentList:[{name:"",score:0,id:0}],
  addStudent:(_newItem) => {}
});


export default function AppContextProvider({children}) {
  const [studentList,setStudentList] = useState([
    {name:"jacob", score:80, id:1},
    {name:"Jon", score:60, id:2},
  ])

  const addStudent = (_newItem) => {
    setStudentList([...studentList, _newItem]);
  }

  const val = {
    studentList,addStudent
  }

  return (
    <AppContext.Provider value={val} >
      {children}
    </AppContext.Provider>
  )
}
