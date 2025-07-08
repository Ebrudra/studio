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

## Data Persistence & Deployment

### Current State: Local Storage

This application currently uses your browser's **local storage** to save sprint and task data. This is great for getting started quickly and running the app locally, but it has some limitations:
- Data is only stored on your machine in your current browser.
- It is not suitable for collaboration with a team.
- Clearing your browser data will erase all your sprints.

### Recommended Upgrade: Firebase Firestore

For a robust, collaborative, and production-ready application, we recommend using a cloud database. **Firebase Firestore** is an excellent choice and is designed to work seamlessly with this tech stack.

**Is it free?**
Yes, Firebase has a very generous free tier called the **Spark Plan**. It includes:
- A significant number of document reads, writes, and deletes per day.
- A base level of cloud storage (typically 1 GiB).
- A number of concurrent connections.

For most small to medium-sized projects, the free tier is more than enough to get started and even run in production. You only have to consider the paid **Blaze Plan** if your app's usage grows significantly beyond these free limits.

*Future steps would involve adding the Firebase SDK and updating the dashboard components to read from and write to Firestore instead of local storage.*
