
import { Route, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './global/Navbar';

function App() {
  return (
    <div className="App">
      <header className="App-header">
       <Routes>
        <Route path='/' element={<Navbar/>}>
          <Route path='/login'/>
          <Route path='/workspace'/>
        </Route>
       </Routes>
      </header>
    </div>
  );
}

export default App;
