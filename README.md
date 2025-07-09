# SprintPilot

This is a Next.js and Genkit application built in Firebase Studio. It uses a local file system for data storage and offers optional cloud sync with **Firebase Firestore**.

## Architecture Overview

SprintPilot uses a **local-first** architecture. All sprint and report data is saved directly to your local file system in a `data/` directory. This makes the application fast and allows for offline use.

For backup and collaboration, you can selectively sync **completed** sprints to a Firebase Firestore database.

## Running Locally

To run this application on your own machine, follow these steps.

### 1. Download the Code

Use the **Download code** button in the Firebase Studio interface to download the project files as a ZIP archive, then unzip it.

### 2. Install Dependencies

Open your terminal, navigate into the project directory, and run the following command to install the necessary packages:

```bash
npm install
```

### 3. Set Up Environment Variables (Optional)

If you plan to use the **Firebase sync** feature, you will need a Firebase project and a Google Gemini API key. If you only plan to use local storage, you can skip this step.

1.  **Get your Gemini API Key**:
    *   Get your free Gemini API key from **[Google AI Studio](https://aistudio.google.com/app/apikey)**.

2.  **Create your local environment file**:
    *   In the project's root directory, make a copy of the `.env` file and rename it to `.env.local`.

3.  **Add your API Key to `.env.local`**:
    ```
    GOOGLE_API_KEY=YOUR_API_KEY_HERE
    ```

### 4. Set Up a Firebase Project (Optional)

To use the cloud sync feature, you need a Firebase project.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and follow the on-screen instructions.
3.  Once your project is created, navigate to the **Project Overview** page. Click the **Web** icon (`</>`) to add a web app.
4.  Give your app a nickname and click **"Register app"**.
5.  Firebase will provide you with a `firebaseConfig` object. You will need these values.
6.  In your new project, go to the **Build** section and select **Firestore Database**.
7.  Click **"Create database"**.
8.  Choose to start in **"test mode"** and select a location. Click **"Enable"**.

### 5. Add Firebase Keys to `.env.local` (Optional)

*   In your Firebase project settings, find the **"SDK setup and configuration"** section.
*   Select the **Config** radio button to view your `firebaseConfig` object.
*   Copy these values into your `.env.local` file:

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
    NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
    ```

### 6. Run the Development Servers

You will need to run two separate processes in two different terminal windows.

**In your first terminal**, run the Next.js web application:

```bash
npm run dev
```

**In your second terminal**, run the Genkit AI flows:

```bash
npm run genkit:dev
```

### 7. Open the App

Once both servers are running, you can open your web browser and navigate to:

[http://localhost:9002](http://localhost:9002)

You can now start creating sprints. The data will be saved in a `data` folder within your project directory.
