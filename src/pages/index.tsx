import User from "@/types/User"; 
import SocialMedias from "@/types/SocialMedias"; 

export default function Home() {  
    // Get the data 
    const fetchData = async () => {
       const userDocument = {
        username: "username1",
        penname: "penname",
        email: "user@gmail.com",
        bio: "this is my bio",
        socials: {
            LinkedIn: "linkedin",
            Facebook: "facebook",
            Instagram: "instagram",
            X: "twitter",
            TikTok: "tiktok",   
        },
        headshot: "link to image",
        };
        await fetch('http://localhost:3000/api/mongoUser', {
            method: 'POST',  
            body: JSON.stringify(userDocument),   
        })  
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    console.log("Successfully connected to database!");
                    console.log(res.data);
                } else {
                    console.log("Could not connect to database!");
                }
            })  
            .catch(error => {
                console.error("Error fetching data:", error); 
            });
    };
    fetchData();

    return <div>Hello</div>;
}