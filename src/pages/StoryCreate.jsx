import React, { useState, useCallback } from "react";
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

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
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
    isValid: false
  });

  const validateHindiText = useCallback((text, storyId) => {
    const hindiRegex = /^[\u0900-\u097F\s।॥ँंः'",!?()\-:"'‘'…]*$/;
    const lines = text.trim().split(/\n+/);
    const results = [];
    let totalWords = 0;
    let isValid = true;

    for (let i = 0; i < lines.length; i++) {
      const para = lines[i].trim();
      if (!para) continue;
      if (!hindiRegex.test(para)) {
        isValid = false;
        continue;
      }
      const wordCount = para.split(/\s+/).filter(Boolean).length;
      if (wordCount > 70) isValid = false;
      results.push(`Paragraph ${i + 1}: ${wordCount} words`);
      totalWords += wordCount;
    }

    setStats({
      paragraphCount: results.length,
      totalWords,
      wordCounts: results,
      isValid
    });

    if (results.length === 0) return "No valid Hindi paragraph found.";

    return {
      message: `The story "${storyId}" has ${results.length} paragraphs. Total words: ${totalWords}.\n${results.join("\n")}\nStory Upload Successful.`,
    };
  }, []);

  const validateField = useCallback((name, value) => {
    const rules = VALIDATION_RULES[name];
    const trimmed = value.trim();

    if (!trimmed) return rules.errorMessages.required;

    if (name === "storyId") {
      if (trimmed.length > rules.maxLength) return rules.errorMessages.length;
      if (/^[-_]|[-_]$/.test(trimmed)) return rules.errorMessages.startEnd;
      if (/_{2,}|-{2,}/.test(trimmed)) return rules.errorMessages.consecutive;
      if (/[-_]{5,}/.test(trimmed)) return "Too many repeated - or _ characters";
      if (/[^ \u0900-\u097F\-_'":!?]/.test(trimmed)) {
        const invalidChar = trimmed.match(/[^ \u0900-\u097F\-_'":!?]/)[0];
        return `Invalid character "${invalidChar}" in Story ID`;
      }
    } else {
      if (trimmed.length < rules.minLength) return rules.errorMessages.length;
      if (/^\s+$/.test(value)) return rules.errorMessages.spaces;
      if (/[<>]/.test(trimmed)) return rules.errorMessages.invalidChars;
      if (/[-_]{5,}/.test(trimmed)) return "Too many repeated - or _ characters";
    }

    return "";
  }, []);

  const debouncedValidate = useCallback(
    debounce((name, value) => {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }, 300),
    [validateField]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "storyContent") {
      validateHindiText(value, formData.storyId);
    }
    if (isTouched[name]) debouncedValidate(name, value);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setIsTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((name) => {
      const error = validateField(name, formData[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    const hindiResult = validateHindiText(formData.storyContent, formData.storyId);
    if (typeof hindiResult === "string") {
      newErrors.storyContent = hindiResult;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
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

      const result = validateHindiText(formData.storyContent, formData.storyId);
      toast.success(typeof result === "object" ? result.message : "Story created successfully!", 
        { autoClose: false });

      setFormData({ storyId: "", storyContent: "" });
      setErrors({});
      setIsTouched({ storyId: false, storyContent: false });
      setStats({
        paragraphCount: 0,
        totalWords: 0,
        wordCounts: [],
        isValid: false
      });
    } catch (err) {
      const msg = err.response?.status === 409 
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
    !Object.values(errors).some(Boolean);

  return (
    <Layout 
      signOut={signOut} 
      user={user}
      sidebarOpen={sidebarOpen}
      toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
    >
      <ToastContainer 
        position="top-right" 
        autoClose={false}
        closeOnClick={false}
        pauseOnHover 
        draggable={false}
        closeButton={true}
      />
    
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
          />
          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className="submit-btn"
          >
            {isSubmitting ? "Creating..." : "Create Story"}
          </button>
        </form>
        
        <div className="stats-panel">
          <h3>Story Statistics</h3>
          {formData.storyContent ? (
            <>
              <p>Paragraphs: {stats.paragraphCount}</p>
              <p>Total Words: {stats.totalWords}</p>
              <div className="word-counts">
                {stats.wordCounts.length > 0 && (
                  <>
                    <p>Word counts per paragraph:</p>
                    <ul>
                      {stats.wordCounts.map((count, index) => (
                        <li key={index}>{count}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <p className={stats.isValid ? "valid" : "invalid"}>
                {stats.isValid ? "✓ Valid Hindi content" : "⚠ Check content for issues"}
              </p>
            </>
          ) : (
            <p>Start typing to see statistics</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

const InputField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  max,
  type,
}) => (
  <div className="input-group">
    <label className="label">{label}</label>
    {type === "textarea" ? (
      <textarea
        className={`textarea ${error ? "error-border" : ""}`}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={`Enter ${label.toLowerCase()}`}
        maxLength={max}
      />
    ) : (
      <input
        className={`input ${error ? "error-border" : ""}`}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={`Enter ${label.toLowerCase()}`}
        maxLength={max}
      />
    )}
    <div className="footer">
      <div className="error">{error}</div>
      <div className={`counter ${value.length > max ? "exceed" : ""}`}>
        {value.length}/{max}
      </div>
    </div>
  </div>
);

export default StoryCreate;