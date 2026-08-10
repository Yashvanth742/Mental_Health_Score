/* =========================================================
   MindScore AI — Frontend Logic
   Vanilla JS only.
   Talks to FastAPI prediction endpoint.
========================================================= */


/* ---------------------------------------------------------
   API CONFIGURATION & AUTO-DETECTION
--------------------------------------------------------- */
let API_URL = "https://mental-health-score-l050.onrender.com";
let activeApiUrl = API_URL;
const PREDICT_URL = `${API_URL}/Predict`;

function getPredictUrl() {
    return `${API_URL}/Predict`;
}


/* ---------------------------------------------------------
   DOM REFERENCES
--------------------------------------------------------- */

const form = document.getElementById("predictForm");
const predictBtn = document.getElementById("predictBtn");
const formAlert = document.getElementById("formAlert");

const resultPanel = document.getElementById("resultPanel");
const assessmentPanel = document.querySelector(".assessment-panel");
const resetBtn = document.getElementById("resetBtn");

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

const navToggle = document.getElementById("navToggle");
const siteNav = document.querySelector(".site-nav");

const themeToggle = document.getElementById("themeToggle");


/* ---------------------------------------------------------
   THEME TOGGLE
--------------------------------------------------------- */

if (themeToggle) {

    const savedTheme =
        localStorage.getItem("mindscore-theme") || "light";

    document.documentElement.setAttribute(
        "data-theme",
        savedTheme
    );

    themeToggle.addEventListener("click", () => {

        const current =
            document.documentElement.getAttribute("data-theme");

        const next =
            current === "dark" ? "light" : "dark";

        document.documentElement.setAttribute(
            "data-theme",
            next
        );

        localStorage.setItem(
            "mindscore-theme",
            next
        );
    });
}


/* ---------------------------------------------------------
   RESULT / LOADING ELEMENTS
--------------------------------------------------------- */

const resultIdle =
    document.getElementById("resultIdle");

const resultIdleDefault =
    document.getElementById("resultIdleDefault");

const resultIdleLoading =
    document.getElementById("resultIdleLoading");


/* ---------------------------------------------------------
   ALLOWED VALUES
   These MUST match FastAPI Literal values.
--------------------------------------------------------- */

const ALLOWED_VALUES = {

    gender: [
        "Male",
        "Female"
    ],

    academic_level: [
        "Undergraduate",
        "Graduate",
        "High School"
    ],

    most_used_platform: [
        "Facebook",
        "LinkedIn",
        "Instagram",
        "Snapchat",
        "Twitter",
        "YouTube",
        "TikTok",
        "LINE",
        "KakaoTalk",
        "VKontakte",
        "WhatsApp",
        "WeChat"
    ],

    purpose_of_use: [
        "Networking",
        "Education",
        "Entertainment",
        "News"
    ],

    stress_level: [
        "Medium",
        "Low",
        "Very High",
        "High"
    ]
};


/* ---------------------------------------------------------
   VALIDATION RULES
--------------------------------------------------------- */

const VALIDATORS = {

    age: (value) =>
        value !== "" &&
        !isNaN(value) &&
        Number.isInteger(Number(value)) &&
        Number(value) >= 10 &&
        Number(value) <= 100,

    gender: (value) =>
        ALLOWED_VALUES.gender.includes(value),

    country: (value) =>
        value.trim().length > 0,

    academic_level: (value) =>
        ALLOWED_VALUES.academic_level.includes(value),

    most_used_platform: (value) =>
        ALLOWED_VALUES.most_used_platform.includes(value),

    purpose_of_use: (value) =>
        ALLOWED_VALUES.purpose_of_use.includes(value),

    avg_daily_usage_hours: (value) =>
        value !== "" &&
        !isNaN(value) &&
        Number(value) >= 0 &&
        Number(value) <= 24,

    daily_unlocks: (value) =>
        value !== "" &&
        !isNaN(value) &&
        Number.isInteger(Number(value)) &&
        Number(value) >= 0,

    study_hours: (value) =>
        value !== "" &&
        !isNaN(value) &&
        Number(value) >= 0 &&
        Number(value) <= 24,

    physical_activity_hours: (value) =>
        value !== "" &&
        !isNaN(value) &&
        Number(value) >= 0 &&
        Number(value) <= 24,

    sleep_hours_per_night: (value) =>
        value !== "" &&
        !isNaN(value) &&
        Number(value) >= 0 &&
        Number(value) <= 24,

    stress_level: (value) =>
        ALLOWED_VALUES.stress_level.includes(value)
};


/* ---------------------------------------------------------
   ERROR MESSAGES
--------------------------------------------------------- */

const ERROR_MESSAGES = {

    age:
        "Enter an age between 10 and 100.",

    gender:
        "Please select Male or Female.",

    country:
        "Please enter your country.",

    academic_level:
        "Please select a valid academic level.",

    most_used_platform:
        "Please select a valid platform.",

    purpose_of_use:
        "Please select a valid purpose.",

    avg_daily_usage_hours:
        "Enter a value between 0 and 24 hours.",

    daily_unlocks:
        "Enter a value of 0 or more.",

    study_hours:
        "Enter a value between 0 and 24 hours.",

    physical_activity_hours:
        "Enter a value between 0 and 24 hours.",

    sleep_hours_per_night:
        "Enter a value between 0 and 24 hours.",

    stress_level:
        "Please select a valid stress level."
};


/* ---------------------------------------------------------
   COUNTRY LIST
--------------------------------------------------------- */

const COUNTRIES = [

    "India",
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "South Korea",
    "China",
    "Brazil",
    "Mexico",
    "South Africa",
    "Nigeria",
    "Indonesia",
    "Philippines",
    "Pakistan",
    "Bangladesh",
    "Vietnam",
    "Italy",
    "Spain",
    "Netherlands",
    "Sweden",
    "Russia",
    "Turkey",
    "Egypt",
    "Saudi Arabia",
    "UAE",
    "Singapore",
    "Malaysia",
    "New Zealand",
    "Ireland",
    "Poland"
];


function populateCountries() {

    const list =
        document.getElementById("countryList");

    if (!list) return;

    list.innerHTML = COUNTRIES
        .map(
            country =>
                `<option value="${country}"></option>`
        )
        .join("");
}


/* ---------------------------------------------------------
   API STATUS & PORT DISCOVERY
--------------------------------------------------------- */

const CANDIDATE_PORTS = [8000, 8001, 5000, 8080];

async function testApiUrl(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal
        });
        clearTimeout(timeout);
        return response.ok ? url : null;
    } catch (e) {
        return null;
    }
}

async function testApiPort(port) {
    return await testApiUrl(`http://127.0.0.1:${port}`);
}

async function checkApiStatus() {
    // 1. Try configured backend URL
    let foundUrl = await testApiUrl(API_URL);

    // 2. Fallback to candidate local ports
    if (!foundUrl) {
        const currentPortMatch = API_URL.match(/:(\d+)$/);
        const currentPort = currentPortMatch ? parseInt(currentPortMatch[1], 10) : CANDIDATE_PORTS[0];

        foundUrl = await testApiPort(currentPort);

        if (!foundUrl) {
            for (const port of CANDIDATE_PORTS) {
                if (port === currentPort) continue;
                foundUrl = await testApiPort(port);
                if (foundUrl) break;
            }
        }
    }

    if (foundUrl) {
        API_URL = foundUrl;
        activeApiUrl = foundUrl;
        setApiStatus(true, foundUrl);
    } else {
        setApiStatus(false);
    }
}


function setApiStatus(online, connectedUrl = API_URL) {

    if (!statusDot || !statusText) return;

    if (online) {

        statusDot.className =
            "status-dot online";

        if (connectedUrl && connectedUrl.includes("onrender.com")) {
            statusText.textContent = "API Connected";
        } else {
            const portMatch = connectedUrl ? connectedUrl.match(/:(\d+)$/) : null;
            const portStr = portMatch ? ` (:${portMatch[1]})` : "";
            statusText.textContent = `API Connected${portStr}`;
        }

    } else {

        statusDot.className =
            "status-dot offline";

        statusText.textContent =
            "API Offline";
    }
}


/* ---------------------------------------------------------
   FIELD VALIDATION UI
--------------------------------------------------------- */

function setFieldValid(name) {

    const element =
        document.getElementById(name);

    if (!element) return;

    const field =
        element.closest(".field");

    const errorElement =
        document.getElementById(
            `err-${name}`
        );

    if (field) {

        field.classList.remove(
            "invalid"
        );
    }

    if (errorElement) {

        errorElement.textContent = "";
    }
}


function setFieldInvalid(name, customMessage = null) {

    const element =
        document.getElementById(name);

    if (!element) return;

    const field =
        element.closest(".field");

    const errorElement =
        document.getElementById(
            `err-${name}`
        );

    if (field) {

        field.classList.add(
            "invalid"
        );
    }

    if (errorElement) {

        errorElement.textContent =
            customMessage ||
            ERROR_MESSAGES[name];
    }
}


function validateField(name) {

    const element =
        document.getElementById(name);

    if (!element) {

        console.error(
            `Element not found: ${name}`
        );

        return false;
    }

    const valid =
        VALIDATORS[name](element.value);

    if (valid) {

        setFieldValid(name);

    } else {

        setFieldInvalid(name);
    }

    return valid;
}


function validateAll() {

    let allValid = true;

    Object.keys(VALIDATORS).forEach(
        name => {

            const valid =
                validateField(name);

            if (!valid) {

                allValid = false;
            }
        }
    );

    return allValid;
}


/* ---------------------------------------------------------
   LIVE VALIDATION
--------------------------------------------------------- */

Object.keys(VALIDATORS).forEach(
    name => {

        const element =
            document.getElementById(name);

        if (!element) return;

        element.addEventListener(
            "blur",
            () => validateField(name)
        );

        element.addEventListener(
            "input",
            () => {

                const field =
                    element.closest(".field");

                if (
                    field &&
                    field.classList.contains(
                        "invalid"
                    )
                ) {

                    validateField(name);
                }
            }
        );

        element.addEventListener(
            "change",
            () => validateField(name)
        );
    }
);


/* ---------------------------------------------------------
   ALERT HELPERS
--------------------------------------------------------- */

function showAlert(message) {

    if (!formAlert) return;

    formAlert.textContent =
        message;

    formAlert.hidden = false;
}


function hideAlert() {

    if (!formAlert) return;

    formAlert.hidden = true;

    formAlert.textContent = "";
}


/* ---------------------------------------------------------
   BUILD API PAYLOAD
--------------------------------------------------------- */

function buildPayload() {

    return {

        age:
            parseInt(document.getElementById("age").value, 10),

        gender:
            document.getElementById("gender").value,

        country:
            document.getElementById("country").value.trim(),

        academic_level:
            document.getElementById("academic_level").value,

        most_used_platform:
            document.getElementById("most_used_platform").value,

        purpose_of_use:
            document.getElementById("purpose_of_use").value,

        avg_daily_usage_hours:
            parseFloat(document.getElementById("avg_daily_usage_hours").value),

        daily_unlocks:
            parseInt(document.getElementById("daily_unlocks").value, 10),

        study_hours:
            parseFloat(document.getElementById("study_hours").value),

        physical_activity_hours:
            parseFloat(document.getElementById("physical_activity_hours").value),

        sleep_hours_per_night:
            parseFloat(document.getElementById("sleep_hours_per_night").value),

        stress_level:
            document.getElementById("stress_level").value
    };
}


/* ---------------------------------------------------------
   SUBMIT
--------------------------------------------------------- */

let isSubmitting = false;


if (form) {

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (isSubmitting) return;

            hideAlert();


            /* -----------------------------
               Validate frontend
            ----------------------------- */

            const valid =
                validateAll();

            if (!valid) {

                showAlert(
                    "Please review the highlighted fields."
                );

                const firstInvalid =
                    form.querySelector(
                        ".field.invalid input, .field.invalid select"
                    );

                if (firstInvalid) {

                    firstInvalid.focus();
                }

                return;
            }


            /* -----------------------------
               Build payload
            ----------------------------- */

            const payload =
                buildPayload();


            /* -----------------------------
               DEBUG
            ----------------------------- */

            console.log(
                "Sending payload to FastAPI:",
                payload
            );

            const predictUrl = getPredictUrl();

            console.log(
                "Prediction URL:",
                predictUrl
            );


            setLoading(true);


            try {

                /* -----------------------------
                   SEND REQUEST TO FASTAPI
                ----------------------------- */

                const response =
                    await fetch(
                        predictUrl,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                console.log(
                    "FastAPI response status:",
                    response.status
                );


                /* -----------------------------
                   422 VALIDATION ERROR
                ----------------------------- */

                if (response.status === 422) {

                    const errorData =
                        await response.json();

                    console.error(
                        "FastAPI 422 error:",
                        errorData
                    );


                    if (
                        errorData.detail &&
                        Array.isArray(
                            errorData.detail
                        )
                    ) {

                        const messages =
                            errorData.detail
                                .map(
                                    error => {

                                        const location =
                                            error.loc
                                                ? error.loc.join(" → ")
                                                : "Field";

                                        return `${location}: ${error.msg}`;
                                    }
                                )
                                .join(" | ");


                        showAlert(
                            `Validation error: ${messages}`
                        );

                    } else {

                        showAlert(
                            "The submitted data is not valid."
                        );
                    }

                    setApiStatus(true);

                    return;
                }


                /* -----------------------------
                   OTHER SERVER ERRORS
                ----------------------------- */

                if (!response.ok) {

                    let errorMessage =
                        "Something went wrong while generating your prediction.";

                    try {

                        const errorData =
                            await response.json();

                        console.error(
                            "FastAPI error:",
                            errorData
                        );

                    } catch (error) {

                        console.error(
                            "Could not read error response:",
                            error
                        );
                    }


                    showAlert(
                        `${errorMessage} Please try again.`
                    );

                    setApiStatus(true);

                    return;
                }


                /* -----------------------------
                   SUCCESS
                ----------------------------- */

                const result =
                    await response.json();


                console.log(
                    "Prediction result:",
                    result
                );


                /* -----------------------------
                   CHECK RESPONSE
                ----------------------------- */

                if (
                    typeof result
                        .predicted_mental_health_score
                    !== "number"
                ) {

                    console.error(
                        "Unexpected API response:",
                        result
                    );

                    showAlert(
                        "The server returned an unexpected prediction."
                    );

                    return;
                }


                setApiStatus(true);


                /* -----------------------------
                   SHOW RESULT
                ----------------------------- */

                renderResult(
                    result.predicted_mental_health_score,
                    payload
                );


            } catch (error) {

                console.error(
                    "Prediction request failed:",
                    error
                );


                showAlert(
                    `Unable to connect to the prediction service (${API_URL}). Please make sure the FastAPI backend is running.`
                );


                setApiStatus(false);


            } finally {

                setLoading(false);
            }
        }
    );
}


/* ---------------------------------------------------------
   LOADING STATE
--------------------------------------------------------- */

function setLoading(isLoading) {

    isSubmitting =
        isLoading;


    if (predictBtn) {

        predictBtn.disabled =
            isLoading;

        predictBtn.classList.toggle(
            "loading",
            isLoading
        );


        const label =
            predictBtn.querySelector(
                ".btn-predict-label"
            );


        if (label) {

            label.textContent =
                isLoading
                    ? "Analyzing Your Data…"
                    : "Predict Mental Health Score";
        }
    }


    /* Show loading vs idle panel correctly */

    if (isLoading) {

        if (resultPanel) {
            resultPanel.hidden = true;
        }

        if (resultIdle) {
            resultIdle.hidden = false;
        }

        if (resultIdleDefault) {
            resultIdleDefault.hidden = true;
        }

        if (resultIdleLoading) {
            resultIdleLoading.hidden = false;
        }

    } else {

        if (resultIdleLoading) {
            resultIdleLoading.hidden = true;
        }

        // If result panel is visible, hide idle card
        if (resultPanel && !resultPanel.hidden) {
            if (resultIdle) {
                resultIdle.hidden = true;
            }
        } else {
            // Otherwise keep idle default visible
            if (resultIdle) {
                resultIdle.hidden = false;
            }
            if (resultIdleDefault) {
                resultIdleDefault.hidden = false;
            }
        }
    }
}


/* ---------------------------------------------------------
   SCORE INTERPRETATION
--------------------------------------------------------- */

const RING_CIRCUMFERENCE =
    2 * Math.PI * 86;


function interpretScore(score) {

    if (score >= 8) {

        return {

            label: "Excellent",

            className: "excellent",

            text:
                "Your predicted score indicates a strong overall well-being profile.",

            color:
                "var(--success)"
        };
    }


    if (score >= 6) {

        return {

            label: "Good",

            className: "good",

            text:
                "Your predicted score indicates a generally positive well-being profile.",

            color:
                "var(--teal)"
        };
    }


    if (score >= 4) {

        return {

            label: "Moderate",

            className: "moderate",

            text:
                "Your predicted score suggests some areas may benefit from attention.",

            color:
                "var(--amber)"
        };
    }


    return {

        label:
            "Needs Attention",

        className:
            "attention",

        text:
            "Your predicted score suggests that additional support and healthier routines may be beneficial.",

        color:
            "var(--danger)"
    };
}


/* ---------------------------------------------------------
   RENDER RESULT
--------------------------------------------------------- */

function renderResult(
    rawScore,
    payload
) {

    const score =
        Math.max(
            0,
            Math.min(
                10,
                Number(rawScore)
            )
        );


    const interpretation =
        interpretScore(score);


    /* Hide idle card and show result panel */

    if (resultIdle) {
        resultIdle.hidden = true;
    }

    if (resultPanel) {

        resultPanel.hidden =
            false;

        resultPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    /* Animate score */

    const scoreElement =
        document.getElementById(
            "scoreValue"
        );

    if (scoreElement) {

        animateNumber(
            scoreElement,
            score
        );
    }


    /* Animate progress ring */

    const ringElement =
        document.getElementById(
            "ringProgress"
        );


    if (ringElement) {

        const offset =
            RING_CIRCUMFERENCE -
            (score / 10) *
            RING_CIRCUMFERENCE;


        ringElement.style.stroke =
            interpretation.color;


        ringElement.style.strokeDashoffset =
            RING_CIRCUMFERENCE;


        requestAnimationFrame(() => {

            requestAnimationFrame(() => {

                ringElement.style.strokeDashoffset =
                    offset;
            });
        });
    }


    /* Interpretation badge */

    const badge =
        document.getElementById(
            "interpBadge"
        );


    if (badge) {

        badge.textContent =
            interpretation.label;

        badge.className =
            `interp-badge ${interpretation.className}`;
    }


    /* Interpretation text */

    const interpretationText =
        document.getElementById(
            "interpText"
        );


    if (interpretationText) {

        interpretationText.textContent =
            interpretation.text;
    }


    /* Result summary */

    const summary =
        document.getElementById(
            "resultSummary"
        );


    if (summary) {

        const chips = [

            [
                "Age",
                payload.age
            ],

            [
                "Academic Level",
                payload.academic_level
            ],

            [
                "Platform",
                payload.most_used_platform
            ],

            [
                "Daily Usage",
                `${payload.avg_daily_usage_hours} hrs`
            ],

            [
                "Sleep",
                `${payload.sleep_hours_per_night} hrs`
            ],

            [
                "Stress Level",
                payload.stress_level
            ]
        ];


        summary.innerHTML =
            chips
                .map(
                    ([label, value]) => `

                    <div class="chip">

                        <span class="chip-label">
                            ${label}
                        </span>

                        <span class="chip-value">
                            ${value}
                        </span>

                    </div>

                    `
                )
                .join("");
    }
}


/* ---------------------------------------------------------
   SCORE COUNT ANIMATION
--------------------------------------------------------- */

function animateNumber(
    element,
    target
) {

    const duration =
        1200;

    const startTime =
        performance.now();


    function tick(currentTime) {

        const progress =
            Math.min(
                (currentTime -
                    startTime) /
                    duration,
                1
            );


        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );


        const current =
            (
                eased *
                target
            ).toFixed(2);


        element.textContent =
            current;


        if (progress < 1) {

            requestAnimationFrame(
                tick
            );

        } else {

            element.textContent =
                target.toFixed(2);
        }
    }


    requestAnimationFrame(
        tick
    );
}


/* ---------------------------------------------------------
   RESET
--------------------------------------------------------- */

if (resetBtn) {

    resetBtn.addEventListener(
        "click",
        () => {

            form.reset();


            Object.keys(
                VALIDATORS
            ).forEach(
                name =>
                    setFieldValid(name)
            );


            hideAlert();


            if (resultPanel) {

                resultPanel.hidden =
                    true;
            }


            if (assessmentPanel) {

                assessmentPanel.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }


            setLoading(false);

            checkApiStatus();
        }
    );
}


/* ---------------------------------------------------------
   MOBILE NAVIGATION
--------------------------------------------------------- */

if (
    navToggle &&
    siteNav
) {

    navToggle.addEventListener(
        "click",
        () => {

            const isOpen =
                siteNav.classList.toggle(
                    "open"
                );


            navToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        }
    );
}


/* ---------------------------------------------------------
   INITIALIZATION
--------------------------------------------------------- */

populateCountries();

checkApiStatus();

setInterval(
    checkApiStatus,
    15000
);