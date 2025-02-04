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

// If you want the same top/bottom logos as the login page:
import companyLogo from "./assets/companyLogo.png";
import poweredBy from "./assets/poweredBy.png";
import googleLogo from "./assets/google.png";

// IMPORTANT: Use the same CSS as your LoginPage
import "./LoginPage.css";

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
        verified: false, // Because they haven't confirmed email yet
        signupMethod: "email/password",
        role: "tier1",
        createdAt: serverTimestamp(),
        lastLoggedOn: null,
        lastLoggedOff: null,
      };
      await setDoc(doc(db, "users", uid), userDocData);

      // 4. Reserve the username in a "usernames" collection
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
          username: "", // or user.email
          verified: user.emailVerified, // Typically true for Google
          signupMethod: "google",
          role: "tier1",
          createdAt: serverTimestamp(),
          lastLoggedOn: null,
          lastLoggedOff: null,
        });
      }

      // The user is now signed in
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
    <div className="login-dark-container">
      {/* If you want the same header logo as LoginPage */}
      <div className="login-header">
        <img
          src={companyLogo}
          alt="Company Logo"
          className="company-logo"
        />
      </div>

      <div className="login-card-dark">
        <h3 className="company-title" style={{ textAlign: "center", marginBottom: "1rem" }}>
          Sign up for Business Health Check
        </h3>

        {/* First Name & Last Name in One Row */}
    <div className="form-row-dark">
    {/* First Name */}
        <div className="form-group-dark">
            <label>First Name</label>
            <input
            type="text"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            />
        </div>

        {/* Last Name */}
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

        {/* Last Name */}
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

    <div className="form-row-dark">
    {/* First Name */}
        <div className="form-group-dark">
        <label>Password</label>
          <div className="password-wrapper-dark">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="password-toggle-icon-dark"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {!isPasswordValid && password.length > 0 && (
            <span className="error-message" style={{ color: "#fecaca" }}>
              Password must be 8-15 characters and include uppercase, lowercase,
              a number, and a special character.
            </span>
          )}
        </div>

        {/* Last Name */}
        <div className="form-group-dark">
        <label>Confirm Password</label>
          <div className="password-wrapper-dark">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <span
              className="password-toggle-icon-dark"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {password && confirmPassword && (
            <span
              style={{
                color: doPasswordsMatch ? "#bbf7d0" : "#fecaca",
                fontSize: "0.9rem",
                marginTop: "0.25rem",
                display: "inline-block",
              }}
            >
              {doPasswordsMatch
                ? "Passwords match"
                : "Passwords do not match"}
            </span>
          )}
        </div>
    </div>

        {/* Registration Success Alert */}
        {showRegistrationSuccessAlert && (
          <div className="alert-dark success-alert-dark" style={{ marginTop: "1rem" }}>
            Registration successful! We’ve sent you a verification email.
          </div>
        )}

        {/* Sign Up Buttons */}
        <button
          className="sign-in-button-dark"
          onClick={handleSignupEmailPassword}
          disabled={!canSubmit}
          style={{ marginBottom: "1rem" }}
        >
          Sign Up with Email
        </button>

        <div className="divider-row">
          <hr className="divider-line" />
          <span className="divider-text">or sign up with</span>
          <hr className="divider-line" />
        </div>

        <button className="google-button" onClick={handleGoogleSignUp}>
          <img src={googleLogo} alt="Google Logo" className="google-logo" />
          Sign Up with Google
        </button>

        <p className="signup-row" style={{ marginTop: "1rem" }}>
          Already have an account?
          <button
            onClick={() => navigate("/login")}
            className="signup-link-dark"
          >
            Sign In
          </button>
        </p>
      </div>

      {/* Footer (optional) */}
      <div className="powered-by-tailkit">
            <span className="powered-by-text">Powered by</span>
            <img
                src={poweredBy}
                alt="Powered By Something"
                className="powered-by-logo"
            />
        </div>

    </div>
  );
}
