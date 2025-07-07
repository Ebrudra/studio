# SprintPilot

This is a Next.js and Genkit application built in Firebase Studio.

## Running Locally

To run this application on your own machine, follow these steps.

### 1. Download the Code

Use the **Download code** button in the Firebase Studio interface to download the project files as a ZIP archive, then unzip it.

### 2. Install Dependencies

Open your terminal, navigate into the project directory, and run the following command to install the necessary packages:

```bash
npm install
```

### 3. Set Up Environment Variables

The application uses Genkit to connect to the Google Gemini API, which requires an API key.

1.  Get your free API key from **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2.  In the project's root directory, make a copy of the `.env` file and rename it to `.env.local`.
3.  Open your new `.env.local` file and add your API key like this:

    ```
    GOOGLE_API_KEY=YOUR_API_KEY_HERE
    ```

### 4. Run the Development Servers

You will need to run two separate processes in two different terminal windows.

**In your first terminal**, run the Next.js web application:

```bash
npm run dev
```

**In your second terminal**, run the Genkit AI flows:

```bash
npm run genkit:dev
```

### 5. Open the App

Once both servers are running, you can open your web browser and navigate to:

[http://localhost:9002](http://localhost:9002)

You should now see the application running locally!