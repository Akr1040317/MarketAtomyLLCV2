// SignupPage.js
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

import companyLogo from "./assets/companyLogo.png";
import poweredBy from "./assets/poweredBy.png";
import googleLogo from "./assets/google.png";

// IMPORTANT: Import the same or similar CSS as LoginPage
import "./LoginPage.css"

export default function SignupPage() {
  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);

  // Password-related
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Alerts
  const [errorMessage, setErrorMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);       // For error alerts
  const [showSuccessAlert, setShowSuccessAlert] = useState(false); // For success alerts

  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();

  // Password rules: 8-15 chars, must include lower, upper, digit, special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;

  // ---- Username Availability Check ----
  const checkUsernameAvailability = async (enteredUsername) => {
    // Reset any prior error alert about the username
    setErrorMessage("");
    setShowAlert(false);

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
    // Basic client-side checks before hitting Firebase
    if (!firstName || !lastName || !email || !username) {
      setErrorMessage("Please fill in all required fields.");
      setShowAlert(true);
      return;
    }
    if (!email.includes("@")) {
      setErrorMessage("Please provide a valid email address.");
      setShowAlert(true);
      return;
    }
    if (!isUsernameAvailable) {
      setErrorMessage("That username is already taken.");
      setShowAlert(true);
      return;
    }
    if (!passwordRegex.test(password)) {
      setErrorMessage(
        "Password must be 8-15 characters and include uppercase, lowercase, a number, and a special character."
      );
      setShowAlert(true);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setShowAlert(true);
      return;
    }

    // If all checks pass, attempt Firebase sign-up
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create user doc in Firestore
      const uid = userCredential.user.uid;
      const userDocData = {
        userId: uid,
        firstName,
        lastName,
        email,
        username,
        verified: false, // They haven't confirmed email yet
        signupMethod: "email/password",
        role: "tier1",
        createdAt: serverTimestamp(),
        lastLoggedOn: null,
        lastLoggedOff: null,
      };
      await setDoc(doc(db, "users", uid), userDocData);

      // Reserve the username in "usernames" collection
      await setDoc(doc(db, "usernames", username), {
        username,
        userId: uid,
        createdAt: serverTimestamp(),
      });

      // If successful, show success alert
      setShowSuccessAlert(true);
      setShowAlert(false);
      setErrorMessage("");
    } catch (error) {
      console.error("Error during sign up:", error);
      setErrorMessage(error.message || "Sign-up failed. Please try again.");
      setShowAlert(true);
    }
  };

  // ---- Sign Up with Google ----
  const handleGoogleSignUp = async () => {
    setShowAlert(false);
    setErrorMessage("");
    setShowSuccessAlert(false);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // If this is a first-time user, create a Firestore doc
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Attempt to parse first/last name
        let parsedFirstName = "";
        let parsedLastName = "";
        if (user.displayName) {
          const nameParts = user.displayName.split(" ");
          parsedFirstName = nameParts[0];
          parsedLastName = nameParts.slice(1).join(" ");
        }

        await setDoc(userDocRef, {
          userId: user.uid,
          firstName: parsedFirstName,
          lastName: parsedLastName,
          email: user.email,
          username: "", // or could store user.email
          verified: user.emailVerified, // Typically true for Google
          signupMethod: "google",
          role: "tier1",
          createdAt: serverTimestamp(),
          lastLoggedOn: null,
          lastLoggedOff: null,
        });
      }

      // Sign-up successful, navigate to dashboard
      setShowSuccessAlert(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error signing up with Google:", error);
      setErrorMessage(error.message || "Google sign-up failed. Please try again.");
      setShowAlert(true);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="login-dark-container">
      {/* Header (same as LoginPage) */}
      <div className="login-header">
        <img src={companyLogo} alt="Company Logo" className="company-logo" />
      </div>

      <div className="login-card-dark">
        <h3 className="company-title" style={{ textAlign: "center", marginBottom: "1rem" }}>
          Sign Up for BHC
        </h3>

        {/* First & Last Name */}
        <div className="form-row-dark">
          <div className="form-group-dark">
            <label>First Name</label>
            <input
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="form-group-dark">
            <label>Last Name</label>
            <input
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        {/* Email & Username */}
        <div className="form-row-dark">
          <div className="form-group-dark">
            <label>Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group-dark">
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
              <span className="error-message" style={{ color: "#fecaca" }}>
                Username is already taken
              </span>
            )}
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="form-row-dark">
          <div className="form-group-dark">
            <label>Password</label>
            <div className="password-wrapper-dark">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="password-toggle-icon-dark" onClick={togglePasswordVisibility}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {/* Show password rule warning if typed something invalid */}
            {!passwordRegex.test(password) && password.length > 0 && (
              <span className="error-message" style={{ color: "#fecaca" }}>
                Password must be 8-15 characters and include uppercase, lowercase,
                a number, and a special character.
              </span>
            )}
          </div>

          <div className="form-group-dark">
            <label>Confirm Password</label>
            <div className="password-wrapper-dark">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <span className="password-toggle-icon-dark" onClick={toggleConfirmPasswordVisibility}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {password && confirmPassword && (
              <span
                style={{
                  color: password === confirmPassword ? "#bbf7d0" : "#fecaca",
                  fontSize: "0.9rem",
                  marginTop: "0.25rem",
                  display: "inline-block",
                }}
              >
                {password === confirmPassword
                  ? "Passwords match"
                  : "Passwords do not match"}
              </span>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {showAlert && (
          <div className="alert-dark error-alert-dark" style={{ marginTop: "1rem" }}>
            {errorMessage}
          </div>
        )}
        {/* Success Alert */}
        {showSuccessAlert && (
          <div className="alert-dark success-alert-dark" style={{ marginTop: "1rem" }}>
            Registration successful! We’ve sent you a verification email.
          </div>
        )}

        {/* Sign Up (Email/Password) */}
        <button
          className="sign-in-button-dark"
          onClick={handleSignupEmailPassword}
          style={{ marginBottom: "1rem" }}
        >
          Sign Up with Email
        </button>

        {/* Divider */}
        <div className="divider-row">
          <hr className="divider-line" />
          <span className="divider-text">or sign up with</span>
          <hr className="divider-line" />
        </div>

        {/* Google Sign Up */}
        <button className="google-button" onClick={handleGoogleSignUp}>
          <img src={googleLogo} alt="Google Logo" className="google-logo" />
          Sign Up with Google
        </button>

        {/* Already have an account? */}
        <p className="signup-row" style={{ marginTop: "1rem" }}>
          Already have an account?
          <button onClick={() => navigate("/login")} className="signup-link-dark">
            Sign In
          </button>
        </p>
      </div>

      {/* Footer */}
      <div className="powered-by-tailkit">
        <span className="powered-by-text">Powered by</span>
        <img src={poweredBy} alt="Powered By Something" className="powered-by-logo" />
      </div>
    </div>
  );
}
