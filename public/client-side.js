
setInterval(updateTime, 1000);
updateTime();

// Update current time each second
function updateTime(){
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const currentDate = new Date();


    const year = currentDate.getFullYear();
    const month = months[currentDate.getMonth()];

    const day =  daysOfWeek[currentDate.getDay()];
    const date = currentDate.getDate();

    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    document.getElementById("currentTime").innerHTML = day + ", " + month + " " + date + ", " + year + ", <br>Time: " + formattedTime;    
    
}

const petGiveawayForm = document.getElementById("petGivewayForm");
const findPetForm = document.getElementById("find-Pet");
const signup = document.getElementById("signup-form");
const login = document.getElementById("login-form");


if(signup){
    document.getElementById("signup-form").addEventListener("submit", async (event) =>{
        event.preventDefault();
        let isValid = true;

        // Clear previous error messages
        const errorElements = document.querySelectorAll(".error");
        errorElements.forEach((element)=>{
            element.innerText = "";
        });

        const usernameRegex = /^[a-zA-Z0-9]+$/;
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/;
        
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;


        if(!usernameRegex.test(username)){
            document.getElementById('usernameError').innerText = "Usernames can contain letters and digits only";
            isValid = false;
        }

        if(!passwordRegex.test(password)){
            document.getElementById('passwordError').innerText = "A password must be at least 4 characters long (letters and digits only), with at least one letter and one digit.";
            isValid = false;
        }

        if(isValid){
            const response = await fetch("/sign-up", {
                method : "POST", 
                headers: {
                    'Content-Type': 'application/json'
                },
                body : JSON.stringify({
                    username : username,
                    password : password
                }) 
            });

            const data = await response.json();
            if(data.signedUp){
                document.getElementById("content").innerHTML = `<h2>Your account has been created successfully!</h2>
                <p>You can now log in whenever you want!</p>`
            } else{
                document.getElementById("passwordError").innerText = data.message;
            }
        }
    });
}

if(login){
    document.getElementById("login-form").addEventListener("submit", async (event)=>{
        event.preventDefault();
        let isValid = true;

        // Clear previous error messages
        const errorElements = document.querySelectorAll(".error");
        errorElements.forEach((element)=>{
            element.innerText = "";
        });
    
        const usernameRegex = /^[a-zA-Z0-9]+$/;
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/;
            
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
    
    
        if(!usernameRegex.test(username)){
            document.getElementById('usernameError').innerText = "Usernames can contain letters and digits only";
            isValid = false;
        }
    
        if(!passwordRegex.test(password)){
            document.getElementById('passwordError').innerText = "A password must be at least 4 characters long (letters and digits only), with at least one letter and one digit.";
            isValid = false;
        }
        

        if(isValid){

            const response = await fetch('/login', {
                method : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                  },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
                
            })

            const data = await response.json();
            
            if(data.loggedIn){
                location.reload();
            }else{
                document.getElementById("passwordError").innerText = data.message;
            }
        }
    });
}

if(findPetForm){
    document.getElementById("find-Pet").addEventListener("submit", async function (event) {
        let isValid = true;
        event.preventDefault();
    
        // Clear previous error messages
        const errorElements = document.querySelectorAll(".error");
        errorElements.forEach(function (element) {
            element.textContent = "";
        });
    
        // Validate Animal Choice
        const animalChoice = document.querySelector('input[name="animal-choice"]:checked');
        if (!animalChoice) {
            document.getElementById("animalChoiceError").textContent = "Please select an animal.";
            isValid = false;
        }
    
        // Validate Breed
        const breed = document.querySelector('input[name="breed"]:checked');
        if (!breed) {
            document.getElementById("breedError").textContent = "Please select a breed.";
            isValid = false;
        }
    
        // Validate Gender
        const gender = document.querySelector('input[name="gender"]:checked');
        if (!gender) {
            document.getElementById("genderError").textContent = "Please select a gender.";
            isValid = false;
        }
    
        // Validate Get Along With
        const getAlongWith = document.querySelectorAll('input[name="get-along-with"]:checked');
        if (getAlongWith.length === 0) {
            document.getElementById("getAlongError").textContent = "Please select at least one option.";
            isValid = false;
        }
    
        // Prevent form submission if validation fails
        if (isValid) {

            const form = document.getElementById("find-Pet");
            const formData = new FormData(form);

            const jsonData = {
                animalChoice : formData.get("animal-choice"),
                breed : formData.get("breed"),
                gender : formData.get("gender"),
                getAlongWith : formData.getAll("get-along-with")
            };

            
            const response = await fetch('/get-pets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData)
            });
            
            const data = await response.json();
            
            if (data.success && data.pets.length >0) {
                // Create the list of matching pets
                const petList = data.pets.map(pet => {
                    return `
                        <li>
                            <strong>Name:</strong> ${pet.petName} <br>
                            <strong>Type:</strong> ${pet.petType} <br>
                            <strong>Breed:</strong> ${pet.petBreed} <br>
                            <strong>Gender:</strong> ${pet.petGender} <br>
                            <strong>Get Along With:</strong> ${pet.petGetAlongWith.join(", ")} <br>
                            <strong>Owner:</strong> ${pet.ownerName} <br>
                            <strong>Bragging:</strong> ${pet.bragging} <br>
                        </li> <br> <br>
                    `;
                }).join(""); // Join all list items into a single string
            
                document.getElementById('content').innerHTML = `<h3>Matching Pets:</h3><ul> ${petList} </ul> <br><a href="/find-dog-cat">Search again</a>`;
            } else {
                document.getElementById('content').innerHTML = `<p>No matching pets found.</p><a href="/find-dog-cat">Try again</a>`;
            }
            
        }

    });
}

if(petGiveawayForm){
    document.getElementById("petGivewayForm").addEventListener("submit", async function (event) {
        let isValid = true;
        event.preventDefault();
        
        const errorElements = document.querySelectorAll(".error");
        errorElements.forEach(function (element) {
            element.textContent = "";
        });
    
        const animalChoice = document.querySelector('input[name="animal-choice"]:checked');
        if (!animalChoice) {
            document.getElementById("animalChoiceError").textContent = "Please select an animal.";
            isValid = false;
        }
    
        const breed = document.querySelector('input[name="breed"]:checked');
        if (!breed) {
            document.getElementById("breedError").textContent = "Please select a breed.";
            isValid = false;
        }
    
        const gender = document.querySelector('input[name="gender"]:checked');
        if (!gender) {
            document.getElementById("genderError").textContent = "Please select a gender.";
            isValid = false;
        }
    
        const getAlongWith = document.querySelectorAll('input[name="get-along-with"]:checked');
        if (getAlongWith.length === 0) {
            document.getElementById("getAlongError").textContent = "Please select at least one option.";
            isValid = false;
        }
    
        const bragging = document.getElementById("bragging").value.trim();
        if (bragging === "") {
            document.getElementById("braggingError").textContent = "Please brag about your animal.";
            isValid = false;
        }
    
        const ownerName = document.getElementById("owner-name").value.trim();
        if (ownerName === "") {
            document.getElementById("ownerNameError").textContent = "Please enter your full name.";
            isValid = false;
        }
    
        const animalName = document.getElementById("animal-name").value.trim();
        if (animalName === "") {
            document.getElementById("animalNameError").textContent = "Please enter your animal's full name.";
            isValid = false;
        }
        

        // Prevent form submission if validation fails
        if (isValid) {
            const formData = {
                animalChoice: animalChoice.value,
                breed: breed.value,
                gender: gender.value,
                getAlongWith: Array.from(getAlongWith).map(element => element.value),
                bragging: bragging,
                ownerName: ownerName,
                animalName: animalName
            };
        
            // Send data to the server
            const response = await fetch("/submit-pet", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json();

            if(data.success){
                document.getElementById("content").innerHTML = "<h2>Thank You for submitting the form, reload the page to submit an other aniaml</h2>";
            } else{
                document.getElementById("animalNameError").innerText = data.message;
            }

        }
        
    
    });
}

