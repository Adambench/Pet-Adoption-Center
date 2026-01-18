const express = require('express')
const session = require("express-session");
const path = require('path')
const fs = require('fs').promises
const app = express();

app.listen(3000, ()=>{console.log("Running on http://localhost:3000")});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: "a-secret-key-to-encrypt-session-data",
    resave : false,
    saveUninitialized : false,
    cookie: {
        maxAge: 1000 * 60 * 60 
    }
}));





// Services:

app.post('/sign-up', async (req, res)=>{try {
    const username = req.body.username;
    const password = req.body.password;

    // Check if the username already exists
    const fileContents = await fs.readFile('login.txt', 'utf-8');

    const lines = fileContents.split('\n');
    const usernameExists = lines.some(line => line.split(';')[0] === username);

    if (usernameExists) {
        return res.json({
            signedUp: false,
            message: 'Username already exists'
        });
    }

    const loginData = `${username};${password}\n`; // \n to ensure new line after each entry

    // Append to the file (using fs.appendFile instead of fs.writeFile)
    await fs.appendFile('login.txt', loginData, 'utf-8');

    req.session.username = username;

    // Responding with a success message
    res.json({
        signedUp: true,
        message: 'User created successfully'
    });

} catch (err) {
    console.error('Error reading or writing to file', err);
    res.json({
        signedUp: false,
        message: 'Error connecting to the server'
    });
}
});


app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const fileContents = await fs.readFile('login.txt', 'utf-8');
    const lines = fileContents.split('\n');
    const user = lines.find(line => line.split(';')[0] === username && line.split(';')[1] === password);

    if(user){
        req.session.username = username;
        res.json({
            loggedIn: true,
            message: 'Logged in successfully'
        });
    }
    else{
        res.json({
            loggedIn: false,
            message: 'Invalid username or password'
        });
    }

});


app.post("/submit-pet", async (req, res)=>{

    const petData = req.body;
    let index = 1;
    const fileContent = await fs.readFile(path.join(__dirname, 'pets.txt'), 'utf-8');
    const lines = await fileContent.trim().split('\n');

    if(lines.length > 0){
        const line = lines[lines.length -1];
        index = Number(line.split(":")[0]) + 1;
    } else{
        index = 1;
    }

    const formattedData = [
        index,
        req.session.username,
        petData.animalChoice,
        petData.breed,
        petData.gender,
        petData.getAlongWith.join(','),
        petData.bragging,
        petData.ownerName,
        petData.animalName
    ].join(':') + '\n';


    try {
        await fs.appendFile('pets.txt', formattedData, 'utf-8');
        res.json({success: true, message: "Pet data submitted successfully!"});
    } catch (error) {
        res.json({success: false, message: "Error submitting pet data"});
    }
});


app.get("/logout", (req, res)=> {
    req.session.destroy((err) => {
        return res.redirect("/");
    });
});

app.post('/get-pets', async (req, res) => {
    const petData = req.body;

    try {
        const fileContent = await fs.readFile(path.join(__dirname, "pets.txt"), 'utf-8');
        const lines = fileContent.trim().split('\n');

        const filteredPets = lines
            .map(line => line.split(":"))
            .filter(pet => {
                const animal = pet[2];
                const breed = pet[3];
                const gender = pet[4];
                const getAlongWith = pet[5].split(",");

                const matchesAnimal = petData.animalChoice === animal;
                const matchesBreed = petData.breed === breed || petData.breed === "dnm";
                const matchesGender = petData.gender === gender || petData.gender === "dnm";

                const matchesGetAlong = Array.isArray(petData.getAlongWith)
                    ? petData.getAlongWith.every(val => getAlongWith.includes(val))
                    : getAlongWith.includes(petData.getAlongWith); // Handles case where only 1 checkbox was selected

                return matchesAnimal && matchesBreed && matchesGender && matchesGetAlong;
            })
            .map(pet => {
                return {
                    petType: pet[2],
                    petBreed: pet[3],
                    petGender: pet[4],
                    petGetAlongWith: pet[5].split(","),
                    petName: pet[7],
                    ownerName: pet[8],
                    bragging: pet[6],
                };
            });

        res.json({
            success: true,
            pets: filteredPets
        });
    } catch (err) {
        console.error("Error reading pets file:", err);
        res.json({
            success: false,
            message: "Failed to retrieve pets"
        });
    }
});


// Pages:

app.get('/', async (req, res)=>{

    let file = await fs.readFile(path.join(__dirname, "public", "template.html"), 'utf-8');

    file = file.replace("{{pageTitle}}", "Pet Adoption Center")
        .replace("{{loginStatus}}", req.session.username ? `Logged in as ${req.session.username}` : "Not logged in")
        .replace("{{loginLink}}", req.session.username ? `<a href="/logout">Logout</a>` : `<a href="/create-account">Create an account</a>`)
        .replace("{{pageName}}", "Welcome to the Pet Adoption Center!")
        .replace("{{pageContent}}", `<h2>Content</h2>
                <p>This is the home page of the home page </p>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Hic odio enim necessitatibus pariatur asperiores quae tempora voluptate alias doloribus repudiandae beatae architecto, animi tenetur illum voluptas aut reiciendis eligendi rerum.</p>
            `)
        .replace("{{/-LinkClass}}", "active")


    res.send(file);

});


app.get("/find-dog-cat", async (req, res)=>{

        let file = await fs.readFile(path.join(__dirname, "public", "template.html"), 'utf-8');

        file = file.replace("{{pageTitle}}", "Find dog/cat!")
            .replace("{{loginStatus}}", req.session.username ? `Logged in as ${req.session.username}` : "Not logged in")
            .replace("{{loginLink}}", req.session.username ? `<a href="/logout">Logout</a>` : `<a href="/create-account">Create an account</a>`)
            .replace("{{pageName}}", "Find dog/cat!")
            .replace("{{pageContent}}", `
                    <h2>Please fill in this form</h2>
                    <form id="find-Pet">
                        <!-- Animal Choice -->
                        <label>Select between a cat or a dog</label> <br>
                        <input type="radio" name="animal-choice" id="dog" value="dog">
                        <label for="dog">Dog</label>
                        <input type="radio" name="animal-choice" id="cat" value="cat">
                        <label for="cat">Cat</label><br>
                        <span id="animalChoiceError" class="error"></span><br><br>
                
                        <!-- Breed -->
                        <label>Breed of the animal</label> <br>
                        <input type="radio" name="breed" id="german-shepherd" value="german shepherd">
                        <label for="german-shepherd">German Shepherd</label>
                        <input type="radio" name="breed" id="persian" value="persian">
                        <label for="persian">Persian</label>
                        <input type="radio" name="breed" id="breed-dnm" value="dnm">
                        <label for="breed-dnm">Does Not Matter</label><br>
                        <span id="breedError" class="error"></span><br><br>
                
                        <!-- Gender -->
                        <label>Preferred Gender</label> <br>
                        <input type="radio" name="gender" id="male" value="male">
                        <label for="male">Male</label>
                        <input type="radio" name="gender" id="female" value="female">
                        <label for="female">Female</label>
                        <input type="radio" name="gender" id="gender-dnm" value="dnm">
                        <label for="gender-dnm">Does Not Matter</label><br>
                        <span id="genderError" class="error"></span><br><br>
                
                        <!-- Get Along With -->
                        <label>Who does it need to get along with?</label> <br>
                        <input type="checkbox" id="other-dogs" value="other-dogs" name="get-along-with">
                        <label for="other-dogs">Other dogs</label>
                        <input type="checkbox" id="other-cats" value="other-cats" name="get-along-with">
                        <label for="other-cats">Other cats</label>
                        <input type="checkbox" id="kids" value="kids" name="get-along-with">
                        <label for="kids">Kids</label><br>
                        <span id="getAlongError" class="error"></span><br><br>
                
                        <!-- Submit and Reset Buttons -->
                        <input type="submit" value="Search">
                        <input type="reset">
                    </form>
                <p id="formSubmitted"></p>
                </td>`)
            .replace("{{find-cat-dog-LinkClass}}", "active")


        res.send(file);
        
});


app.get("/dog-care", async (req, res)=>{

    let file = await fs.readFile(path.join(__dirname, "public", "template.html"), 'utf-8');

    file = file.replace("{{pageTitle}}", "Dog Care")
        .replace("{{loginStatus}}", req.session.username ? `Logged in as ${req.session.username}` : "Not logged in")
        .replace("{{loginLink}}", req.session.username ? `<a href="/logout">Logout</a>` : `<a href="/create-account">Create an account</a>`)
        .replace("{{pageName}}", "Dog Care")
        .replace("{{pageContent}}", `<h2>Content about Dog Care page goes here</h2>
                <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Impedit illum quas neque at. Similique dolores eaque accusantium, odio ut porro officia repellat vel. Laborum laboriosam impedit, nesciunt esse quos quae?</p>`)
        .replace("{{dog-care-LinkClass}}", "active")

    res.send(file);
});


app.get("/cat-care", async (req, res)=>{

    let file = await fs.readFile(path.join(__dirname, "public", "template.html"), 'utf-8');

    file = file.replace("{{pageTitle}}", "Cat Care")
        .replace("{{loginStatus}}", req.session.username ? `Logged in as ${req.session.username}` : "Not logged in")
        .replace("{{loginLink}}", req.session.username ? `<a href="/logout">Logout</a>` : `<a href="/create-account">Create an account</a>`)
        .replace("{{pageName}}", "Cat Care")
        .replace("{{pageContent}}", `<h2>Content about Cat Care page goes here</h2>
                <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Impedit illum quas neque at. Similique dolores eaque accusantium, odio ut porro officia repellat vel. Laborum laboriosam impedit, nesciunt esse quos quae?</p>`)
        .replace("{{cat-care-LinkClass}}", "active")

    res.send(file);
});



app.get("/create-account", async (req, res)=>{

    let file = await fs.readFile(path.join(__dirname, "public", "template.html"), 'utf-8');

    file = file.replace("{{pageTitle}}", "Create Account")
        .replace("{{loginStatus}}", req.session.username ? `Logged in as ${req.session.username}` : "Not logged in")
        .replace("{{loginLink}}", req.session.username ? `<a href="/logout">Logout</a>` : `<a href="/create-account">Create an account</a>`)
        .replace("{{pageName}}", "Create an account here!")
        .replace("{{pageContent}}", `
                <form id="signup-form" class="account-form">
                <h1>Sign Up Now!</h1>
                    <h3>Username</h3>
                    <label>
                        <input type="text" placeholder="JohnDoe" id="username" required>
                    </label>
                    <p id="usernameError" class="error"></p>
                
                    <h3>Password</h3>

                    <label>
                        <input type="password" id="password" placeholder="Password" required>
                    </label>
                    <p id="passwordError" class="error">
                       
                    </p>
                    <input type="submit">
                </form>`)
        .replace("{{create-account-LinkClass}}", "active")
    res.send(file);
});


app.get("/privacy-disclaimer-statement", async (req, res)=>{

    let file = await fs.readFile(path.join(__dirname, "public", "template.html"), 'utf-8');

    file = file.replace("{{pageTitle}}", "Privacy")
        .replace("{{pageName}}", "Privacy Disclamer Statement")
        .replace("{{pageContent}}", `<h1>Privacy statement goes here</h><br>
                <a href="/">return to home page</a>`)

    res.send(file);
    
});


app.get("/contact-us", async (req, res)=>{

    let file = await fs.readFile(path.join(__dirname, "public", "template.html"), 'utf-8');

    file = file.replace("{{pageTitle}}", "Contact Pet Center")
        .replace("{{loginStatus}}", req.session.username ? `Logged in as ${req.session.username}` : "Not logged in")
        .replace("{{loginLink}}", req.session.username ? `<a href="/logout">Logout</a>` : `<a href="/create-account">Create an account</a>`)
        .replace("{{pageName}}", "Contact Us!")
        .replace("{{pageContent}}", `
                <h2>Name: Adam Benchekroun</h2>
                <h2>Student Id: 40306874</h2>
                <h2>Email: benche.adam@gmail.com</h2>`)
        .replace("{{contact-us-LinkClass}}", "active")


    res.send(file);
    
});


app.get("/have-a-pet-to-give-away", async (req, res)=>{
    let file = await fs.readFile(path.join(__dirname, "public", "template.html"), 'utf-8');

    if(req.session.username){
        file = file.replace("{{pageTitle}}", "Giveway Pet")
                    .replace("{{loginStatus}}", req.session.username ? `Logged in as ${req.session.username}` : "Not logged in")
                    .replace("{{loginLink}}", req.session.username ? `<a href="/logout">Logout</a>` : `<a href="/create-account">Create an account</a>`)
                    .replace("{{pageName}}", "Have a pet to give away!")
                    .replace("{{pageContent}}", `
                        
                        <h2>Please fill in the following form:</h2>
                            <form id="petGivewayForm">
                                <!-- Animal Choice -->
                                <label>Select between a cat or a dog</label> <br>
                                <input type="radio" name="animal-choice" id="dog" value="dog">
                                <label for="dog">Dog</label>
                                <input type="radio" name="animal-choice" id="cat" value="cat">
                                <label for="cat">Cat</label><br>
                                <span id="animalChoiceError" class="error"></span><br><br>
                        
                                <!-- Breed -->
                                <label>Breed of the animal</label> <br>
                                <input type="radio" name="breed" id="german-shepherd" value="german shepherd">
                                <label for="german-shepherd">German Shepherd</label>
                                <input type="radio" name="breed" id="persian" value="persian">
                                <label for="persian">Persian</label>
                                <input type="radio" name="breed" id="shiba" value="shiba">
                                <label for="shiba">Shiba</label><br>
                                <span id="breedError" class="error"></span><br><br>
                        
                                <!-- Gender -->
                                <label>Animal Gender</label> <br>
                                <input type="radio" name="gender" id="male" value="male">
                                <label for="male">Male</label>
                                <input type="radio" name="gender" id="female" value="female">
                                <label for="female">Female</label>
                                <input type="radio" name="gender" id="gender-dnm" value="dnm">
                                <label for="gender-dnm">Does Not Matter</label><br>
                                <span id="genderError" class="error"></span><br><br>
                        
                                <!-- Get Along With -->
                                <label>Who does it get along with?</label> <br>
                                <input type="checkbox" id="other-dogs" value="other-dogs" name="get-along-with">
                                <label for="other-dogs">Other dogs</label>
                                <input type="checkbox" id="other-cats" value="other-cats" name="get-along-with">
                                <label for="other-cats">Other cats</label>
                                <input type="checkbox" id="kids" value="kids" name="get-along-with">
                                <label for="kids">Kids</label><br>
                                <span id="getAlongError" class="error"></span><br><br>
                        
                                <!-- Bragging -->
                                <label for="bragging">Brag about your animal here:</label> <br>
                                <textarea name="bragging" id="bragging" placeholder="brag here!"></textarea><br>
                                <span id="braggingError" class="error"></span><br><br>
                        
                                <!-- Owner Name -->
                                <label for="owner-name">Your full name:</label>
                                <input type="text" id="owner-name" name="owner full name" placeholder="Jhon Doe"><br>
                                <span id="ownerNameError" class="error"></span><br>
                        
                                <!-- Animal Name -->
                                <label for="animal-name">Your animal's full name:</label>
                                <input type="text" id="animal-name" name="animal full name" placeholder="Jhon Doey"><br>
                                <span id="animalNameError" class="error"></span><br><br>
                        
                                <!-- Submit and Reset Buttons -->
                                <input type="submit">
                                <input type="reset">
                            </form>
                        
                            <p id="formSubmitted"></p>`)
                    .replace("{{pet-give-away-LinkClass}}", "active")
    
        res.send(file);

    } else{
        file = file.replace("{{pageTitle}}", "Pet Center")
        .replace("{{pageName}}", "Have a pet to give away!")
        .replace("{{loginStatus}}", req.session.username ? `Logged in as ${req.session.username}` : "Not logged in")
        .replace("{{loginLink}}", req.session.username ? `<a href="/logout">Logout</a>` : `<a href="/create-account">Create an account</a>`)
        .replace("{{pageContent}}", `
                <form id="login-form" class="account-form">
                <h1>Log In</h1>
                    <h3>Username</h3>
                    <label>
                        <input type="text" placeholder="JohnDoe" id="username" required>
                    </label>
                    <p id="usernameError" class="error"></p>
                
                    <h3>Password</h3>

                    <label>
                        <input type="password" id="password" placeholder="Password" required>
                    </label>
                    <p id="passwordError" class="error">
                       
                    </p>
                    <input type="submit">
                </form>`)
        .replace("{{pet-give-away-LinkClass}}", "active")
        res.send(file);

    }

});


