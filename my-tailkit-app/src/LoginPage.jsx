import React, { useState } from "react";
import { auth, db } from "./firebaseConfig"; 
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./LoginPageDark.css";  // Updated dark-themed CSS

import googleLogo from "./assets/google.png";
import companyLogo from "./assets/companyLogo.png";
import poweredBy from "./assets/poweredBy.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();

  // --- Email/Password Sign In ---
  const handleSignIn = async () => {
    if (!email || !password) {
      setErrorMessage("Incorrect login. Please check your email/password.");
      setShowAlert(true);
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user doc exists in Firestore
      const userId = user.uid;
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      // If no doc, create a basic one
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          userId,
          email: user.email,
          verified: user.emailVerified,
          signupMethod: "email/password",
          role: "tier1",
          createdAt: serverTimestamp(),
          lastLoggedOn: null,
          lastLoggedOff: null,
        });
      }

      setShowSuccessAlert(true);
      setTimeout(() => {
        navigate("/dashboard"); 
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message);
      setShowAlert(true);
    }
  };

  // --- Google Sign In ---
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user doc exists; if not, create it
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        let parsedFirstName = "";
        let parsedLastName = "";
        if (user.displayName) {
          const parts = user.displayName.split(" ");
          parsedFirstName = parts[0];
          parsedLastName = parts.slice(1).join(" ");
        }
        await setDoc(userDocRef, {
          userId: user.uid,
          firstName: parsedFirstName,
          lastName: parsedLastName,
          email: user.email,
          username: "",
          verified: user.emailVerified,
          signupMethod: "google",
          role: "tier1",
          createdAt: serverTimestamp(),
          lastLoggedOn: null,
          lastLoggedOff: null,
        });
      }

      setShowSuccessAlert(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message);
      setShowAlert(true);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-dark-container">
      <div className="login-header">
        <img
          src={companyLogo}
          alt="Company Logo"
          className="company-logo"
        />
      </div>

      <div className="login-card-dark">
        {/* Email */}
        <div className="form-group-dark">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="form-group-dark">
          <label>Password</label>
          <div className="password-wrapper-dark">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="password-toggle-icon-dark" onClick={togglePasswordVisibility}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        

        {/* Alerts */}
        {showAlert && <div className="alert-dark error-alert-dark">{errorMessage}</div>}
        {showSuccessAlert && <div className="alert-dark success-alert-dark">Login successful! Redirecting...</div>}

        {/* Sign In Button */}
        <button className="sign-in-button-dark" onClick={handleSignIn}>
          Sign In
        </button>

        {/* Or sign in with */}
        <div className="divider-row">
          <hr className="divider-line" />
          <span className="divider-text">or sign in with</span>
          <hr className="divider-line" />
        </div>

        {/* Google Button */}
        <button className="sign-in-button google-button" onClick={handleGoogleSignIn}>
            <img src={googleLogo} alt="Google Logo" className="google-logo" />
            Sign Up with Google
          </button>

        {/* Sign up */}
        <p className="signup-row">
          Don’t have an account yet?{" "}
          <button className="signup-link-dark" onClick={() => navigate("/signup")}>
            Sign up
          </button>
        </p>
        {/* No "Remember me" now. Just Forgot Password? */}
        <div className="forgot-row">
          <button className="forgot-link" onClick={() => navigate("/forgot-password")}>
            Forgot Password?
          </button>
        </div>
      </div>

      <div className="powered-by-tailkit">
        <img
          src={poweredBy}
          alt="Powered By Something"
          className="powered-by-logo"
        />
      </div>
    </div>
  );
}
