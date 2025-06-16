import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VALIDATION_RULES = {
  storyId: {
    minLength: 1,
    maxLength: 50,
    errorMessages: {
      required: "Story ID is required",
      startEnd: "Cannot start or end with - or _",
      consecutive: "Cannot have consecutive - or _ characters",
      length: "Must be less than 50 characters",
    },
  },
  storyContent: {
    minLength: 10,
    maxLength: 500,
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
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

const validateHindiText = (text, storyId) => {
  const hindiRegex = /^[\u0900-\u097F\s।,!?'"():\-]+$/;
  const lines = text.trim().split(/\n+/);
  const results = [];

  let totalWords = 0;

  for (let i = 0; i < lines.length; i++) {
    const para = lines[i].trim();
    if (!para) continue;

    if (!hindiRegex.test(para)) {
      return `Paragraph ${i + 1} contains non-Hindi characters.`;
    }

    const wordCount = para.split(/\s+/).filter(Boolean).length;

    if (wordCount > 70) {
      return `Paragraph ${i + 1} has ${wordCount} words. Max allowed is 70.`;
    }

    results.push(`Para ${i + 1} - ${wordCount} words`);
    totalWords += wordCount;
  }

  if (results.length === 0) return "No valid Hindi paragraph found.";

  return {
    message: `The story "${storyId}" has ${results.length} paragraphs. The total number of words in the story are ${totalWords}.\n${results.join("\n")}\nStory Upload Successful.`,
  };
};

const StoryCreate = ({ signOut, user }) => {
  const [formData, setFormData] = useState({ storyId: "", storyContent: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTouched, setIsTouched] = useState({ storyId: false, storyContent: false });

  const validateField = useCallback((name, value) => {
    const rules = VALIDATION_RULES[name];
    const trimmedValue = value.trim();

    if (!trimmedValue) return rules.errorMessages.required;

    if (name === "storyId") {
      if (trimmedValue.length > rules.maxLength) return rules.errorMessages.length;
      if (/^[-_]|[-_]$/.test(trimmedValue)) return rules.errorMessages.startEnd;
      if (/_{2,}|-{2,}/.test(trimmedValue)) return rules.errorMessages.consecutive;
    } else {
      if (
        trimmedValue.length < rules.minLength ||
        trimmedValue.length > rules.maxLength
      ) return rules.errorMessages.length;
      if (/^\s+$/.test(value)) return rules.errorMessages.spaces;
      if (/[<>]/.test(trimmedValue)) return rules.errorMessages.invalidChars;
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
    if (isTouched[name]) {
      debouncedValidate(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setIsTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
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
  }, [formData, validateField]);

  const isFormValid = useCallback(() => {
    return (
      formData.storyId.trim().length >= VALIDATION_RULES.storyId.minLength &&
      formData.storyContent.trim().length >= VALIDATION_RULES.storyContent.minLength &&
      !Object.values(errors).some(Boolean)
    );
  }, [formData, errors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsTouched({ storyId: true, storyContent: true });

    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await axios.post(
        "https://po11gme8w0.execute-api.eu-north-1.amazonaws.com/prod/generate-story",
        {
          storyId: formData.storyId.trim(),
          storyContent: formData.storyContent.trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const hindiResult = validateHindiText(formData.storyContent, formData.storyId);
      if (typeof hindiResult === "object") {
        toast.success(hindiResult.message, { autoClose: 10000 });
      } else {
        toast.success("Story created successfully!");
      }

      setFormData({ storyId: "", storyContent: "" });
      setErrors({});
      setIsTouched({ storyId: false, storyContent: false });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.response?.status === 409
          ? "Story ID already exists"
          : err.request
          ? "Network error"
          : "Failed to create story";
      toast.error(errorMessage);
      console.log("Error creating story:", err.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles = (name) => ({
    width: "100%",
    padding: "10px",
    borderRadius: "5px",
    border: errors[name] ? "1px solid #ff4444" : "1px solid #ccc",
    marginBottom: "5px",
    resize: "vertical",
    height: name === "storyContent" ? "200px" : "auto",
  });

  return (
    <div>
      <Navbar signOut={signOut} user={user} />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ flex: 1, backgroundColor: "#f5f7fa", minHeight: "90vh" }}>
          <ToastContainer position="top-center" autoClose={5000} />
          <h1 style={{ textAlign: "center", margin: "20px 0" }}>Create Story</h1>

          <form onSubmit={handleSubmit} style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px" }}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Story ID:</label>
              <input
                name="storyId"
                value={formData.storyId}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter unique story ID or story title"
                style={inputStyles("storyId")}
                maxLength={VALIDATION_RULES.storyId.maxLength}
              />
              <CharCounter current={formData.storyId.length} max={VALIDATION_RULES.storyId.maxLength} error={errors.storyId} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Story Content:</label>
              <textarea
                name="storyContent"
                value={formData.storyContent}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your story content"
                style={inputStyles("storyContent")}
                maxLength={VALIDATION_RULES.storyContent.maxLength}
              />
              <CharCounter current={formData.storyContent.length} max={VALIDATION_RULES.storyContent.maxLength} error={errors.storyContent} />
            </div>

            <button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              style={{
                padding: "12px 24px",
                backgroundColor: isFormValid() ? "#0072bc" : "#cccccc",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: isFormValid() ? "pointer" : "not-allowed",
                fontSize: "1rem",
                fontWeight: "500",
                transition: "background-color 0.3s",
              }}
            >
              {isSubmitting ? "Creating..." : "Create Story"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const CharCounter = ({ current, max, error }) => (
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
    <div style={{ color: "#ff4444", fontSize: "0.85rem" }}>{error}</div>
    <div style={{ fontSize: "0.85rem", color: current > max ? "#ff4444" : "#666" }}>{current}/{max}</div>
  </div>
);

export default StoryCreate;
