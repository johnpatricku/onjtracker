document.addEventListener("DOMContentLoaded", async () => {
  let currentUser = null
  let assignments = []
  let givenRatings = []
  let receivedRatings = []
  let selectedRating = 0

  // Initialize dashboard
  await initDashboard()

  async function initDashboard() {
    currentUser = await checkAuth("supervisor")
    if (!currentUser) return

    // Update user info in header
    document.getElementById("userName").textContent = `Welcome, ${currentUser.full_name}`

    // Load data
    await loadData()

    // Setup event listeners
    setupEventListeners()

    // Update profile tab
    updateProfile()
  }

  async function loadData() {
    await Promise.all([loadAssignments(), loadGivenRatings(), loadReceivedRatings()])

    updateDashboard()
    updateRatingForm()
    updateGivenRatings()
    updateReceivedRatings()
  }

  async function loadAssignments() {
    const { data, error } = await supabase
      .from("assignments")
      .select(`
                id,
                student:student_id (
                    id,
                    full_name,
                    email,
                    department
                )
            `)
      .eq("supervisor_id", currentUser.id)
      .eq("status", "active")

    if (error) {
      console.error("Error loading assignments:", error)
      return
    }

    assignments = data || []
  }

  async function loadGivenRatings() {
    const { data, error } = await supabase
      .from("supervisor_to_student_ratings")
      .select(`
                *,
                student:student_id (
                    id,
                    full_name,
                    email,
                    department
                )
            `)
      .eq("supervisor_id", currentUser.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading given ratings:", error)
      return
    }

    givenRatings = data || []
  }

  async function loadReceivedRatings() {
    const { data, error } = await supabase
      .from("student_to_supervisor_ratings")
      .select(`
                *,
                student:student_id (
                    id,
                    full_name,
                    email,
                    department
                )
            `)
      .eq("supervisor_id", currentUser.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading received ratings:", error)
      return
    }

    receivedRatings = data || []
  }

  function updateDashboard() {
    // Update stats
    document.getElementById("studentsCount").textContent = assignments.length
    document.getElementById("givenRatingsCount").textContent = givenRatings.length
    document.getElementById("receivedRatingsCount").textContent = receivedRatings.length

    // Calculate average rating
    const averageRating =
      receivedRatings.length > 0
        ? (receivedRatings.reduce((sum, rating) => sum + rating.rating, 0) / receivedRatings.length).toFixed(1)
        : "0"
    document.getElementById("averageRating").textContent = `${averageRating}/5`

    // Update students list
    const studentsList = document.getElementById("studentsList")

    if (assignments.length === 0) {
      studentsList.innerHTML = '<p class="no-data">No students assigned</p>'
    } else {
      studentsList.innerHTML = assignments
        .map(
          (assignment) => `
                <div class="student-item">
                    <div class="item-info">
                        <h4>${assignment.student.full_name}</h4>
                        <p>${assignment.student.department}</p>
                        <p>${assignment.student.email}</p>
                    </div>
                    <span class="status-badge active">Active</span>
                </div>
            `,
        )
        .join("")
    }
  }

  function updateRatingForm() {
    const studentSelect = document.getElementById("studentSelect")

    studentSelect.innerHTML = '<option value="">Choose a student to rate</option>'

    assignments.forEach((assignment) => {
      const option = document.createElement("option")
      option.value = assignment.student.id
      option.textContent = `${assignment.student.full_name} - ${assignment.student.department}`
      studentSelect.appendChild(option)
    })
  }

  function updateGivenRatings() {
    const givenRatingsList = document.getElementById("givenRatingsList")

    if (givenRatings.length === 0) {
      givenRatingsList.innerHTML = '<p class="no-data">No ratings given yet</p>'
    } else {
      givenRatingsList.innerHTML = givenRatings
        .map(
          (rating) => `
                <div class="rating-item">
                    <div class="item-info">
                        <h4>${rating.student.full_name}</h4>
                        <p><strong>Category:</strong> ${rating.category}</p>
                        <div class="star-rating-display">
                            ${generateStarsHTML(rating.rating)}
                        </div>
                        <p><strong>Date:</strong> ${formatDate(rating.created_at)}</p>
                        ${rating.feedback ? `<p><strong>Feedback:</strong> ${rating.feedback}</p>` : ""}
                    </div>
                </div>
            `,
        )
        .join("")
    }
  }

  function updateReceivedRatings() {
    const receivedRatingsList = document.getElementById("receivedRatingsList")

    if (receivedRatings.length === 0) {
      receivedRatingsList.innerHTML = '<p class="no-data">No ratings received yet</p>'
    } else {
      receivedRatingsList.innerHTML = receivedRatings
        .map(
          (rating) => `
                <div class="rating-item">
                    <div class="item-info">
                        <h4>From: ${rating.student.full_name}</h4>
                        <div class="star-rating-display">
                            ${generateStarsHTML(rating.rating)}
                        </div>
                        <p><strong>Date:</strong> ${formatDate(rating.created_at)}</p>
                        ${rating.feedback ? `<p><strong>Feedback:</strong> ${rating.feedback}</p>` : ""}
                    </div>
                </div>
            `,
        )
        .join("")
    }
  }

  function generateStarsHTML(rating) {
    let starsHTML = ""
    for (let i = 1; i <= 5; i++) {
      starsHTML += `<span class="star ${i <= rating ? "active" : ""}">⭐</span>`
    }
    return starsHTML
  }

  function updateProfile() {
    document.getElementById("profileName").textContent = currentUser.full_name
    document.getElementById("profileEmail").textContent = currentUser.email
    document.getElementById("profileRole").textContent = currentUser.role
    document.getElementById("profileDepartment").textContent = currentUser.department
  }

  function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const tabName = this.dataset.tab

        // Update active tab button
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"))
        this.classList.add("active")

        // Update active tab content
        document.querySelectorAll(".tab-content").forEach((content) => {
          content.classList.remove("active")
        })
        document.getElementById(tabName).classList.add("active")
      })
    })

    // Star rating
    const starRating = document.getElementById("starRating")
    renderStars(0, starRating, true, (rating) => {
      selectedRating = rating
    })

    // Rating form submission
    document.getElementById("ratingForm").addEventListener("submit", async (e) => {
      e.preventDefault()
      await submitRating()
    })

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", logout)
  }

  async function submitRating() {
    const studentId = document.getElementById("studentSelect").value
    const category = document.getElementById("categorySelect").value
    const feedback = document.getElementById("feedback").value

    if (!studentId || !category || selectedRating === 0) {
      showMessage("Please fill in all required fields", "error")
      return
    }

    const { error } = await supabase.from("supervisor_to_student_ratings").insert({
      supervisor_id: currentUser.id,
      student_id: studentId,
      rating: selectedRating,
      feedback: feedback,
      category: category,
    })

    if (error) {
      showMessage(error.message, "error")
      return
    }

    showMessage("Rating submitted successfully!", "success")

    // Reset form
    document.getElementById("ratingForm").reset()
    selectedRating = 0
    renderStars(0, document.getElementById("starRating"), true, (rating) => {
      selectedRating = rating
    })

    // Reload data
    await loadData()
  }

  // Mock showMessage function (replace with your actual implementation)
  function showMessage(message, type) {
    console.log(`${type}: ${message}`)
    // You can replace this with your actual implementation, e.g., using a toast library or displaying the message in a designated area on the page.
  }
})
