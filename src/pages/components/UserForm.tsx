// Form to collect pen name, email, short biography, social media
// On submission, prints user info to console

import {useState} from 'react';
import ReactDOM from 'react-dom/client';

export function MyForm() {
    const [user, setUser] = useState({name : "",
                                      email : "",
                                      bio : "",
                                      socMedia : ""})    
    
    const onChangeUser = (e : React.ChangeEvent<HTMLInputElement>) => {
        setUser({...user, [e.target.name] : e.target.value});
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log(user);
    }              
            
    return (
        <form onSubmit={handleSubmit}>
            <label>Enter your pen name:
                <input type="text" 
                      value={user.name}
                      name="name"      
                      onChange={onChangeUser}/>
            </label>
            <br></br>
            <label>Enter your email address:
                <input type="text"
                      value={user.email}
                      name="email"
                      onChange={onChangeUser}/>
            </label>
            <br></br>
            <label>Enter a short biography:
                <input type="text" 
                      value={user.bio}
                      name="bio"
                      onChange={onChangeUser}/>
            </label>
            <br></br>
            <label>Enter any social media accounts:
                <input type="text" 
                      value={user.socMedia}
                      name="socMedia"
                      onChange={onChangeUser}/>
            </label>
            <br></br>
            <button type = "submit">Submit</button>
        </form>
      )
}