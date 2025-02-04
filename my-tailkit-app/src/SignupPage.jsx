import React, { useState } from "react";
import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./LoginPage.css"; // Reusing the same CSS as LoginPage

export default function SignupPage() {
  // Form state for email/password sign-up
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);

  // Password-related state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Alerts / Navigation
  const [showRegistrationSuccessAlert, setShowRegistrationSuccessAlert] =
    useState(false);
  const navigate = useNavigate();

  // Google Provider
  const googleProvider = new GoogleAuthProvider();

  // ----- Password Rules -----
  // 8-15 chars, must include lowercase, uppercase, digit, and special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;

  // ---- Username Availability Check ----
  const checkUsernameAvailability = async (enteredUsername) => {
    if (!enteredUsername) {
      setIsUsernameAvailable(true);
      return;
    }

    try {
      const usernameDoc = await getDoc(doc(db, "usernames", enteredUsername));
      // If the doc exists in "usernames", that means it's taken
      setIsUsernameAvailable(!usernameDoc.exists());
    } catch (error) {
      console.error("Error checking username availability:", error);
      // If there's an error, assume username is available to avoid blocking signup
      setIsUsernameAvailable(true);
    }
  };

  // ---- Sign Up with Email/Password ----
  const handleSignupEmailPassword = async () => {
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 2. Send email verification
      await sendEmailVerification(userCredential.user);

      // 3. Create user doc in Firestore
      const uid = userCredential.user.uid;
      const userDocData = {
        userId: uid,
        firstName,
        lastName,
        email,
        username,
        verified: false, // Because they haven't confirmed email
        signupMethod: "email/password",
        role: "tier1",
        createdAt: serverTimestamp(),
        lastLoggedOn: null,
        lastLoggedOff: null,
      };

      await setDoc(doc(db, "users", uid), userDocData);

      // 4. Reserve the username in a "usernames" collection, if you want
      //    (So no one else can take it.)
      await setDoc(doc(db, "usernames", username), {
        username,
        userId: uid,
        createdAt: serverTimestamp(),
      });

      setShowRegistrationSuccessAlert(true);
    } catch (error) {
      console.error("Error during sign up:", error);
    }
  };

  // ---- Sign Up with Google ----
  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // If this is a first-time user, create a Firestore doc
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Attempt to parse first/last name from displayName if available
        let parsedFirstName = "";
        let parsedLastName = "";
        if (user.displayName) {
          const nameParts = user.displayName.split(" ");
          parsedFirstName = nameParts[0];
          parsedLastName = nameParts.slice(1).join(" ");
        }

        // You can leave `username` blank or default it to something:
        // e.g. user.email or user.uid. Or you can open a "Complete Profile" page.
        await setDoc(userDocRef, {
          userId: user.uid,
          firstName: parsedFirstName,
          lastName: parsedLastName,
          email: user.email,
          username: "", // or user.email, or prompt them later
          verified: user.emailVerified, // Typically true for Google
          signupMethod: "google",
          role: "tier1",
          createdAt: serverTimestamp(),
          lastLoggedOn: null,
          lastLoggedOff: null,
        });
      }

      // The user is now signed in with Google
      // If you want a "welcome" or "dashboard" redirect:
      navigate("/dashboard");
    } catch (error) {
      console.error("Error signing up with Google:", error);
    }
  };

  // --- Helpers ---
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Whether the form is valid for Email/Password
  const isPasswordValid = passwordRegex.test(password);
  const doPasswordsMatch = password === confirmPassword;
  const canSubmit =
    firstName &&
    lastName &&
    email.includes("@") &&
    username &&
    isUsernameAvailable &&
    isPasswordValid &&
    doPasswordsMatch;

  return (
    <div className="login-page-container">
      <img
        src="/IconResized.png"
        alt="Business Health Assessment Logo"
        className="login-logo"
      />
      <h2 className="login-title">Sign up for Business Health Assessment</h2>

      <div className="login-card">
        {/* -- Email/Password Form Fields -- */}
        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter a username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              checkUsernameAvailability(e.target.value);
            }}
          />
          {!isUsernameAvailable && (
            <span className="error-message">Username is already taken</span>
          )}
        </div>

        <div className="form-group password-group">
          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="password-toggle-icon"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {!isPasswordValid && password.length > 0 && (
            <span className="error-message">
              Password must be 8-15 characters and include uppercase, lowercase,
              a number, and a special character.
            </span>
          )}
        </div>

        <div className="form-group password-group">
          <label>Confirm Password</label>
          <div className="password-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <span
              className="password-toggle-icon"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {password && confirmPassword && (
            <span
              className={`password-match-indicator ${
                doPasswordsMatch ? "match" : "no-match"
              }`}
            >
              {doPasswordsMatch ? "Passwords match" : "Passwords do not match"}
            </span>
          )}
        </div>

        {showRegistrationSuccessAlert && (
          <div className="alert success-alert">
            Registration successful! We’ve sent you a verification email.
          </div>
        )}

        {/* -- Email/Password Sign Up Button -- */}
        <div className="button-group" style={{ flexDirection: "column", gap: "0.5rem" }}>
          <button
            className="sign-in-button"
            onClick={handleSignupEmailPassword}
            disabled={!canSubmit}
          >
            Sign Up with Email
          </button>

          {/* -- Google Sign Up Button -- */}
          <button
            className="sign-in-button"
            style={{ backgroundColor: "#4285F4" }}
            onClick={handleGoogleSignUp}
          >
            Sign Up with Google
          </button>
        </div>

        {/* Already have an account? */}
        <div className="signup-link">
          <span>Already have an account? </span>
          <button
            onClick={() => navigate("/login")}
            className="signup-link-button"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
