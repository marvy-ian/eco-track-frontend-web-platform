/* ==========================================================================
           A. COOKIE/DATA STORAGE STRUCTS & CONFIGS
           ========================================================================== */
// Carbon Factor Weights (kg CO2 per metric unit per month)
const EMISSION_COEFFICIENTS = {
  car: 0.22, // kg per km
  motorcycle: 0.11, // kg per km
  bus: 0.04, // flat proxy modifier scale
  train: 0.01, // low electric transit index
  flights: 250, // multi-ton baseline modifier per unit scalar
  kwh_ph_peso: 0.08, // Approx 0.7kg CO2 per kWh at roughly 9-11 PHP / kWh
  ac_factor: 45, // dynamic direct additive scalar
  diet_heavy: 180, // intensive meat agriculture impact
  diet_light: 110,
  diet_pesc: 85,
  diet_veg: 60,
  diet_vegan: 35,
  eat_out_factor: 8, // processing supply chains multiplier
  shopping_factor: { rarely: 5, monthly: 15, weekly: 40, daily: 95 },
  recycle_offset: -25, // processing recovery credit
};

let currentStep = 1;
let finalComputedFootprint = 0;
let finalComputedEcoScore = 0;

/* ==========================================================================
           B. DOM INITIALIZATION & OBSERVERS
           ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initScrollNavbar();
  initMobileNavigation();
  initIntersectionObservers();
  executeLiveCounterRun();
  loadPersistentPledges();
  updateVisualizerSimulation(100);
});

// Sticky Navbar Scroll Handler
function initScrollNavbar() {
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}

// Mobile Burger Switcher
function initMobileNavigation() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  hamburger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("active");
    hamburger.setAttribute("aria-expanded", isOpen);
    hamburger.innerHTML = isOpen
      ? `<i class="fa-solid fa-xmark"></i>`
      : `<i class="fa-solid fa-bars"></i>`;
  });

  // Close menu upon smooth targeting
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      hamburger.innerHTML = `<i class="fa-solid fa-bars"></i>`;
      hamburger.setAttribute("aria-expanded", "false");
    });
  });
}

// Smooth Section Jumper
function scrollToSection(id) {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth" });
  }
}

// Scroll Animation Engine using IntersectionObserver
function initIntersectionObservers() {
  const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        // Trigger numerical count-ups if elements exist inside entry target
        const textCounters = entry.target.querySelectorAll(".counter-animate");
        textCounters.forEach((tc) => animateTextCounterValue(tc));
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document
    .querySelectorAll(".reveal")
    .forEach((el) => revealObserver.observe(el));
}

/* ==========================================================================
           C. COUNTER ANIMATION SUBROUTINES
           ========================================================================== */
function executeLiveCounterRun() {
  const counterElement = document.getElementById("hero-counter");
  const target = parseInt(counterElement.getAttribute("data-target"), 10);

  // Generate starting position
  let current = target - 350;
  counterElement.innerText = current.toLocaleString();

  // Constant dynamic tick
  setInterval(() => {
    current += Math.floor(Math.random() * 4) + 1;
    counterElement.innerText = current.toLocaleString();
  }, 2400);
}

function animateTextCounterValue(element) {
  const target = parseFloat(element.getAttribute("data-target"));
  const isDecimal = target % 1 !== 0;
  let current = 0;
  const stepDuration = 30;
  const stepsTotal = 40;
  const delta = target / stepsTotal;
  let stepCount = 0;

  const timer = setInterval(() => {
    current += delta;
    stepCount++;
    if (stepCount >= stepsTotal) {
      element.innerText = isDecimal ? target.toFixed(1) : Math.floor(target);
      clearInterval(timer);
    } else {
      element.innerText = isDecimal ? current.toFixed(1) : Math.floor(current);
    }
  }, stepDuration);
}

/* ==========================================================================
           D. CARBON FOOTPRINT ENGINE (CALCULATOR CORE)
           ========================================================================== */
function toggleConditionalInput(show) {
  const targetDiv = document.getElementById("conditional-distance");
  if (show) {
    targetDiv.classList.add("show");
  } else {
    targetDiv.classList.remove("show");
    document.getElementById("distance_km").value = 0;
  }
}

function navigateStep(direction) {
  if (direction === 1 && !validateCurrentStepForm()) return;

  const currentStepEl = document.getElementById(`step-${currentStep}`);
  currentStepEl.classList.remove("active");

  currentStep += direction;
  const nextStepEl = document.getElementById(
    `step-${currentStep === 5 ? "results" : currentStep}`,
  );
  nextStepEl.classList.add("active");

  updateProgressBarState();
  evaluateNavButtonVisibilities();

  if (currentStep === 5) {
    executeCarbonCalculationArchitecture();
  }
}

function validateCurrentStepForm() {
  if (currentStep === 1) {
    const selectedMode = document.querySelector(
      'input[name="commute_mode"]:checked',
    ).value;
    if (selectedMode === "car" || selectedMode === "motorcycle") {
      const distance = parseFloat(document.getElementById("distance_km").value);
      if (isNaN(distance) || distance <= 0) {
        alert("Please enter a valid weekly travel distance greater than 0.");
        return false;
      }
    }
  }
  return true;
}

function updateProgressBarState() {
  const progressFill = document.getElementById("calc-progress");
  const calculatedPercentage = ((currentStep - 1) / 4) * 100;
  progressFill.style.width = `${Math.min(calculatedPercentage, 100)}%`;
}

function evaluateNavButtonVisibilities() {
  const prevBtn = document.getElementById("btn-prev");
  const nextBtn = document.getElementById("btn-next");
  const navContainer = document.getElementById("calc-nav-buttons");

  if (currentStep === 1) {
    prevBtn.style.visibility = "hidden";
    nextBtn.style.visibility = "visible";
    navContainer.style.display = "flex";
  } else if (currentStep > 1 && currentStep < 5) {
    prevBtn.style.visibility = "visible";
    nextBtn.style.visibility = "visible";
    navContainer.style.display = "flex";
    nextBtn.innerHTML =
      currentStep === 4
        ? `Generate Audit &nbsp;<i class="fa-solid fa-wand-magic-sparkles"></i>`
        : `Next Step &nbsp;<i class="fa-solid fa-chevron-right"></i>`;
  } else {
    // Results terminal view state
    navContainer.style.display = "none";
  }
}

function executeCarbonCalculationArchitecture() {
  const form = document.getElementById("footprint-form");

  // 1. Gather Transport Configuration
  const transitMode = form.elements["commute_mode"].value;
  const weeklyKm =
    parseFloat(document.getElementById("distance_km").value) || 0;
  const annualFlightsScalar = parseFloat(form.elements["flights"].value);

  let transitEmissions = 0;
  if (transitMode === "car" || transitMode === "motorcycle") {
    transitEmissions = weeklyKm * 4.33 * EMISSION_COEFFICIENTS[transitMode];
  } else if (transitMode === "bus" || transitMode === "train") {
    transitEmissions = 30 * EMISSION_COEFFICIENTS[transitMode]; // baseline mass proxy
  }
  const structuralFlightEmissions =
    (annualFlightsScalar * EMISSION_COEFFICIENTS.flights) / 12;

  // 2. Gather Structural Energy Inputs
  const electricityBillPhp = parseFloat(
    form.elements["electricity_bill"].value,
  );
  const acUsageProfile = form.elements["ac_use"].value;

  const rawEnergyEmissions =
    electricityBillPhp * EMISSION_COEFFICIENTS.kwh_ph_peso;
  const acEmissionsMarkup =
    acUsageProfile === "yes"
      ? EMISSION_COEFFICIENTS.ac_factor
      : acUsageProfile === "sometimes"
        ? EMISSION_COEFFICIENTS.ac_factor * 0.4
        : 0;

  // 3. Gather Dietary Profiles
  const dietaryProfileKey = form.elements["diet"].value;
  const diningFrequencyFactor = parseFloat(form.elements["eat_out"].value);

  let primaryDietEmissions = 0;
  if (dietaryProfileKey === "heavy_meat")
    primaryDietEmissions = EMISSION_COEFFICIENTS.diet_heavy;
  else if (dietaryProfileKey === "light_meat")
    primaryDietEmissions = EMISSION_COEFFICIENTS.diet_light;
  else if (dietaryProfileKey === "pescatarian")
    primaryDietEmissions = EMISSION_COEFFICIENTS.diet_pesc;
  else if (dietaryProfileKey === "vegetarian")
    primaryDietEmissions = EMISSION_COEFFICIENTS.diet_veg;
  else if (dietaryProfileKey === "vegan")
    primaryDietEmissions = EMISSION_COEFFICIENTS.diet_vegan;

  const peripheralDiningEmissions =
    diningFrequencyFactor * EMISSION_COEFFICIENTS.eat_out_factor;

  // 4. Gather Consumption & Waste Profiling
  const ecomFrequencyKey = form.elements["shopping"].value;
  const recyclingRoutineKey = form.elements["recycle"].value;

  const commerceEmissions =
    EMISSION_COEFFICIENTS.shopping_factor[ecomFrequencyKey];
  const wasteReductionCredit =
    recyclingRoutineKey === "always"
      ? EMISSION_COEFFICIENTS.recycle_offset
      : recyclingRoutineKey === "sometimes"
        ? EMISSION_COEFFICIENTS.recycle_offset * 0.4
        : 0;

  // 5. Consolidated Computational Synthesis
  finalComputedFootprint = Math.max(
    15,
    Math.round(
      transitEmissions +
        structuralFlightEmissions +
        rawEnergyEmissions +
        acEmissionsMarkup +
        primaryDietEmissions +
        peripheralDiningEmissions +
        commerceEmissions +
        wasteReductionCredit,
    ),
  );

  // 6. Scale Personal Structural Eco Score (Inverse tracking logic)
  // Baseline 100 max score bounded downwards toward 0 based on high threshold bounds (e.g., 600kg max)
  finalComputedEcoScore = Math.max(
    5,
    Math.min(100, Math.round(100 - finalComputedFootprint / 6.5)),
  );

  renderResultsDashboardView(finalComputedFootprint, finalComputedEcoScore);
}

function renderResultsDashboardView(footprint, score) {
  document.getElementById("computed-co2-val").innerText = footprint;
  document.getElementById("eco-score-val").innerText = `${score}/100`;
  document.getElementById("label-user-val").innerText = `${footprint} kg`;

  // Animate scale match fill bar
  const fillWidthPercentage = Math.min((footprint / 500) * 100, 100);
  document.getElementById("bar-user-fill").style.width =
    `${fillWidthPercentage}%`;

  // Assign structural risk validation badge
  const badge = document.getElementById("footprint-rating-badge");
  badge.className = "badge-rating"; // wipe state definitions

  if (footprint <= 120) {
    badge.innerText = "🟢 Low Footprint Profile";
    badge.classList.add("badge-low");
  } else if (footprint > 120 && footprint <= 250) {
    badge.innerText = "🟡 Moderate Profile";
    badge.classList.add("badge-moderate");
  } else if (footprint > 250 && footprint <= 450) {
    badge.innerText = "🔴 High Footprint Demand";
    badge.classList.add("badge-high");
  } else {
    badge.innerText = "🔥 Critical Structural Loading";
    badge.classList.add("badge-critical");
  }

  // Draw custom radial vector map loop via standard canvas pipeline
  drawRadialResultCanvasIndicator(score);
}

function drawRadialResultCanvasIndicator(scorePercentage) {
  const canvas = document.getElementById("resultsRadialChart");
  const ctx = canvas.getContext("2d");
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 90;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Track circle arc track geometry background layer
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 12;
  ctx.stroke();

  // Dynamic tracking value system boundary calculations
  let currentFocalAngle = 0;
  const focalTargetRadianValue = (scorePercentage / 100) * (2 * Math.PI);

  function animateCircleStrokeLoop() {
    if (currentFocalAngle < focalTargetRadianValue) {
      currentFocalAngle += 0.12;
      if (currentFocalAngle > focalTargetRadianValue)
        currentFocalAngle = focalTargetRadianValue;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Re-draw structural track background bounds
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 12;
      ctx.stroke();

      // Render current active radial sector array path mapping
      ctx.beginPath();
      // Invert mapping orientation logic to start structural peak arc straight up at -PI/2
      ctx.arc(
        centerX,
        centerY,
        radius,
        -Math.PI / 2,
        -Math.PI / 2 + currentFocalAngle,
      );
      ctx.strokeStyle =
        scorePercentage > 65
          ? "#52B788"
          : scorePercentage > 40
            ? "#F4A261"
            : "#E76F51";
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.stroke();

      requestAnimationFrame(animateCircleStrokeLoop);
    }
  }
  animateCircleStrokeLoop();
}

function copyEmissionsReport() {
  const templateSummaryString = `=== ECOTRACK AUDIT TRANSACTION LEDGER ===\nVerified Carbon Profile: ${finalComputedFootprint} kg CO2/month\nStructural Quality Score: ${finalComputedEcoScore}/100\nPhilippine Scale Variance: ${finalComputedFootprint - 150} kg relative baseline.\nCalculated via index.html standalone cryptographic engines.`;
  navigator.clipboard
    .writeText(templateSummaryString)
    .then(() => {
      alert("Structural profile report copied to system clipboard registry.");
    })
    .catch(() => {
      alert(
        "Buffer access denied. Report string payload:\n\n" +
          templateSummaryString,
      );
    });
}

/* ==========================================================================
           E. DISCOVERY SECTION FILTERS
           ========================================================================== */
function filterTips(category, triggerBtn) {
  // Swap focused button selection accentuation vectors
  const buttons = triggerBtn.parentElement.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => btn.classList.remove("active"));
  triggerBtn.classList.add("active");

  // Manage visible cards array transitions
  const targetTipCards = document.querySelectorAll(
    "#tips-grid-container .tip-card",
  );
  targetTipCards.forEach((card) => {
    const targetCardCategory = card.getAttribute("data-category");
    if (category === "all" || targetCardCategory === category) {
      card.classList.remove("hidden");
      card.style.animation = "fadeIn 0.4s ease-in-out forwards";
    } else {
      card.classList.add("hidden");
    }
  });
}

/* ==========================================================================
           F. PLEDGE WALL LEDGER MANAGEMENT (LOCALSTORAGE ARRAYS)
           ========================================================================== */
function loadPersistentPledges() {
  const localBufferRegistry = localStorage.getItem("ecotrack_pledges");
  let initialMockSeedArray = [
    {
      name: "Juan Dela Cruz",
      message:
        "I will decouple personal daily transit from internal combustion engines.",
    },
    {
      name: "Sitti Dimaporo",
      message:
        "I will process, clean, and sort 100% of internal dry domestic waste streams.",
    },
  ];

  if (localBufferRegistry) {
    initialMockSeedArray = JSON.parse(localBufferRegistry);
  } else {
    localStorage.setItem(
      "ecotrack_pledges",
      JSON.stringify(initialMockSeedArray),
    );
  }

  renderPledgeWallArrayDOM(initialMockSeedArray);
}

function handlePledgeSubmit(event) {
  event.preventDefault();
  const inputName = document.getElementById("pledge-name");
  const selectOption = document.getElementById("pledge-selection");

  const currentPayloadStruct = {
    name: inputName.value.trim(),
    message: selectOption.value,
  };

  const existingPledgeArray = JSON.parse(
    localStorage.getItem("ecotrack_pledges") || "[]",
  );
  existingPledgeArray.unshift(currentPayloadStruct); // prioritize visually on stack tracking
  localStorage.setItem("ecotrack_pledges", JSON.stringify(existingPledgeArray));

  renderPledgeWallArrayDOM(existingPledgeArray);

  // Clean interface track inputs
  inputName.value = "";
  selectOption.selectedIndex = 0;
}

function renderPledgeWallArrayDOM(pledgeArrayData) {
  const ledgerWallOutputBox = document.getElementById("pledge-wall-output");
  const counterIndicatorLabel = document.getElementById("pledge-counter-text");

  ledgerWallOutputBox.innerHTML = "";
  counterIndicatorLabel.innerText = `${pledgeArrayData.length} global citizens have authorized vows`;

  pledgeArrayData.forEach((item) => {
    const cardBlock = document.createElement("div");
    cardBlock.className = "pledge-card";
    cardBlock.innerHTML = `<h5>${escapeHtmlSecurity(item.name)}</h5><p>"${escapeHtmlSecurity(item.message)}"</p>`;
    ledgerWallOutputBox.appendChild(cardBlock);
  });
}

function escapeHtmlSecurity(string) {
  return string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ==========================================================================
           G. IMPACT MULTIPLIER SIMULATOR UTILITIES
           ========================================================================== */
function updateVisualizerSimulation(sliderValue) {
  const numericValue = parseInt(sliderValue, 10);
  document.getElementById("slider-current-indicator").innerText =
    `${numericValue.toLocaleString()} citizen nodes`;

  // Operational performance calculations model equations
  // Standard proxy calculation assumes roughly average 180kg baseline * 20% savings targeted matrix = ~36kg optimized monthly balance point
  const computedTonsSavedAnnualized = ((numericValue * 36 * 12) / 1000).toFixed(
    1,
  );
  const relativeTreeEquivalencyUnits = Math.round(
    computedTonsSavedAnnualized * 45.4,
  ); // Standard 45.4 index factor proxy multiplier bounds

  document.getElementById("viz-stat-people").innerText =
    numericValue.toLocaleString();
  document.getElementById("viz-stat-co2").innerText =
    computedTonsSavedAnnualized;
  document.getElementById("viz-stat-trees").innerText =
    relativeTreeEquivalencyUnits.toLocaleString();

  syncDynamicTreeIconsVisualization(relativeTreeEquivalencyUnits);
}

function syncDynamicTreeIconsVisualization(targetTreesCount) {
  const iconFlexBucket = document.getElementById("tree-icon-bucket");

  // Cap icon element node allocation ceiling to prevent interface stack crash risks
  const visualRenderCeilingCount = Math.min(
    65,
    Math.max(3, Math.floor(targetTreesCount / 120)),
  );
  const activeElementsCurrentlyInBucket = iconFlexBucket.children.length;

  if (activeElementsCurrentlyInBucket < visualRenderCeilingCount) {
    for (
      let idx = activeElementsCurrentlyInBucket;
      idx < visualRenderCeilingCount;
      idx++
    ) {
      const treeIcon = document.createElement("i");
      treeIcon.className = "fa-solid fa-tree";
      iconFlexBucket.appendChild(treeIcon);
      setTimeout(() => treeIcon.classList.add("grow"), idx * 12);
    }
  } else if (activeElementsCurrentlyInBucket > visualRenderCeilingCount) {
    for (
      let idx = activeElementsCurrentlyInBucket - 1;
      idx >= visualRenderCeilingCount;
      idx--
    ) {
      if (iconFlexBucket.children[idx]) {
        iconFlexBucket.children[idx].remove();
      }
    }
  }
}

function handleNewsletterSubmit(event) {
  event.preventDefault();
  const targetEmailInput = document.getElementById("news-email");
  const targetEmailStringValue = targetEmailInput.value.trim();

  const registrationArray = JSON.parse(
    localStorage.getItem("ecotrack_newsletter") || "[]",
  );
  registrationArray.push({
    email: targetEmailStringValue,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(
    "ecotrack_newsletter",
    JSON.stringify(registrationArray),
  );

  targetEmailInput.value = "";
  const successBlockLabel = document.getElementById("news-success-msg");
  successBlockLabel.style.display = "block";

  setTimeout(() => {
    successBlockLabel.style.display = "none";
  }, 6000);
}
