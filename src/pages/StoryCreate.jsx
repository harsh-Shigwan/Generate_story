import React, { useState, useCallback, useRef } from "react";
import Layout from "../components/Layout";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./StoryCreate.css";
import DOMPurify from "dompurify";

const VALIDATION_RULES = {
  storyId: {
    minLength: 1,
    maxLength: 50,
    errorMessages: {
      required: "Story ID or Story title is required",
      startEnd: "Cannot start or end with - or _",
      consecutive: "Cannot have consecutive - or _ characters",
      length: "Must be less than 50 characters",
    },
  },
  storyContent: {
    minLength: 10,
    maxLength: 5000,
    errorMessages: {
      required: "Story content is required",
      length: "Must be greater than 10 characters",
      spaces: "Cannot be just spaces",
      invalidChars: "Cannot contain <, > characters",
    },
  },
};

const StoryCreate = ({ signOut, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({ storyId: "", storyContent: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTouched, setIsTouched] = useState({
    storyId: false,
    storyContent: false,
  });
  const [stats, setStats] = useState({
    paragraphCount: 0,
    totalWords: 0,
    wordCounts: [],
    isValid: false,
    errorMessages: [], // Added to store multiple error messages
  });

  const validationState = useRef({
    storyId: { isValid: false, error: "" },
    storyContent: { isValid: false, error: "" },
  });

const validateHindiText = useCallback((text) => {
  const hindiRegex = /^[\u0900-\u097F\s।॥ँंः'",!?()\-:"'‘'…]*$/;
  const lines = text.trim().split(/\n+/);
  const results = [];
  let totalWords = 0;
  let isValid = true;
  const errorMessages = [];

  for (let i = 0; i < lines.length; i++) {
    const para = lines[i].trim();
    if (!para) continue;

    // Find invalid characters
    const invalidChars = [];
    for (const char of para) {
      if (!hindiRegex.test(char)) {
        if (!invalidChars.includes(char)) {
          invalidChars.push(char);
        }
      }
    }

    if (invalidChars.length > 0) {
      isValid = false;
      errorMessages.push(`Paragraph ${i + 1} has invalid chars: ${invalidChars.join(' ')}`);
    }

    const wordCount = para.split(/[\s\-]+/).filter(Boolean).length;
    if (wordCount > 70) {
      isValid = false;
      errorMessages.push(`Paragraph ${i + 1} exceeds 70 words (${wordCount})`);
    }

    results.push(`Paragraph ${i + 1}: ${wordCount} words`);
    totalWords += wordCount;
  }

  setStats({
    paragraphCount: results.length,
    totalWords,
    wordCounts: results,
    isValid,
    errorMessages,
  });

  validationState.current.storyContent = {
    isValid,
    error: !isValid ? errorMessages.join(' ') : "",
  };

  if (!isValid || results.length === 0) {
    setErrors((prev) => ({
      ...prev,
      storyContent: errorMessages.length > 0 ? errorMessages[0] : "No valid Hindi paragraph found.",
    }));
    return false;
  }

  setErrors((prev) => ({ ...prev, storyContent: "" }));
  return true;
}, []);

  const validateField = useCallback((name, value) => {
    const rules = VALIDATION_RULES[name];
    const trimmed = value.trim();

    if (!trimmed) {
      validationState.current[name] = {
        isValid: false,
        error: rules.errorMessages.required,
      };
      return rules.errorMessages.required;
    }

    if (name === "storyId") {
      if (trimmed.length > rules.maxLength)
        return rules.errorMessages.length;
      if (/^[-_]|[-_]$/.test(trimmed))
        return rules.errorMessages.startEnd;
      if (/_{2,}|-{2,}/.test(trimmed))
        return rules.errorMessages.consecutive;
      if (/[-_]{5,}/.test(trimmed))
        return "Too many repeated - or _ characters";
      if (/[^ \u0900-\u097F\-_'":!?]/.test(trimmed))
        return `Invalid character "${trimmed.match(/[^ \u0900-\u097F\-_'":!?]/)[0]}" in Story ID`;
    }

    if (name === "storyContent") {
      if (trimmed.length < rules.minLength)
        return rules.errorMessages.length;
      if (/^\s+$/.test(value))
        return rules.errorMessages.spaces;
      if (/[<>]/.test(trimmed))
        return rules.errorMessages.invalidChars;
       if (/[^ \u0900-\u097F\-_'":!?]/.test(trimmed))
        return `Invalid character "${trimmed.match(/[^ \u0900-\u097F\-_'":!?]/)[0]}" in Story content`;
    }

    validationState.current[name] = { isValid: true, error: "" };
    return "";
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "storyContent") {
      validateHindiText(value);
    } else {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setIsTouched((prev) => ({ ...prev, [name]: true }));

    if (name === "storyContent") {
      validateHindiText(value);
    } else {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = useCallback(() => {
    const storyIdError = validateField("storyId", formData.storyId);
    const storyContentValid = validateHindiText(formData.storyContent);

    setErrors((prev) => ({
      ...prev,
      storyId: storyIdError,
    }));

    return (
      !storyIdError &&
      storyContentValid &&
      validationState.current.storyId.isValid &&
      validationState.current.storyContent.isValid
    );
  }, [formData, validateField, validateHindiText]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsTouched({ storyId: true, storyContent: true });

    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await axios.post(
        "https://po11gme8w0.execute-api.eu-north-1.amazonaws.com/prod/generate-story",
        {
          storyId: DOMPurify.sanitize(formData.storyId.trim()),
          storyContent: DOMPurify.sanitize(formData.storyContent.trim()),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success("Story created successfully!", { autoClose: false });
      setFormData({ storyId: "", storyContent: "" });
      setErrors({});
      setIsTouched({ storyId: false, storyContent: false });
      setStats({ 
        paragraphCount: 0, 
        totalWords: 0, 
        wordCounts: [], 
        isValid: false,
        errorMessages: [] 
      });
    } catch (err) {
      const msg =
        err.response?.status === 409
          ? "Story ID already exists"
          : err.request
          ? "Network error"
          : "Failed to create story";
      toast.error(msg, { autoClose: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () =>
    formData.storyId.trim().length >= VALIDATION_RULES.storyId.minLength &&
    formData.storyContent.trim().length >= VALIDATION_RULES.storyContent.minLength &&
    validationState.current.storyId.isValid &&
    validationState.current.storyContent.isValid;

  return (
    <Layout signOut={signOut} user={user} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)}>
      <ToastContainer position="top-right" autoClose={false} closeButton />
      <div className="form-container">
        <form onSubmit={handleSubmit} className="form-wrapper">
          <InputField
            label="Story ID / Title:"
            name="storyId"
            type="text"
            value={formData.storyId}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.storyId}
            max={VALIDATION_RULES.storyId.maxLength}
            isTouched={isTouched.storyId}
          />
          <InputField
            label="Story Content:"
            name="storyContent"
            type="textarea"
            value={formData.storyContent}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.storyContent}
            max={VALIDATION_RULES.storyContent.maxLength}
            isTouched={isTouched.storyContent}
          />
          <button type="submit" disabled={!isFormValid() || isSubmitting} className="submit-btn">
            {isSubmitting ? "Creating..." : "Create Story"}
          </button>
        </form>

        <div className="stats-panel">
          <h3>Story Statistics</h3>
          {formData.storyContent ? (
            <>
              <p>Paragraphs: {stats.paragraphCount}</p>
              <p>Total Words: {stats.totalWords}</p>
              {stats.wordCounts.length > 0 && (
                <div className="word-counts">
                  <p>Word counts per paragraph:</p>
                  <ul>
                    {stats.wordCounts.map((count, index) => (
                      <li key={index}>{count}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className={stats.isValid ? "valid" : "invalid"}>
                {stats.isValid ? "✓ Valid Hindi content" : "⚠ Check content for issues"}
              </p>
              {!stats.isValid && stats.errorMessages.length > 0 && (
                <div className="error-messages">
                  <p>Issues found:</p>
                  <ul>
                    {stats.errorMessages.map((msg, index) => (
                      <li key={index} className="error-message">{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p>Start typing to see statistics</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

const InputField = ({ label, name, value, onChange, onBlur, error, max, type, isTouched }) => (
  <div className="input-group">
    <label className="label">{label}</label>
    {type === "textarea" ? (
      <textarea
        className={`textarea ${error && isTouched ? "error-border" : ""}`}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={`Enter ${label.toLowerCase()}`}
        maxLength={max}
      />
    ) : (
      <input
        className={`input ${error && isTouched ? "error-border" : ""}`}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={`Enter ${label.toLowerCase()}`}
        maxLength={max}
      />
    )}
    <div className="footer">
      <div className="error">{error && isTouched ? error : ""}</div>
      <div className={`counter ${value.length > max ? "exceed" : ""}`}>
        {value.length}/{max}
      </div>
    </div>
  </div>
);

export default StoryCreate;