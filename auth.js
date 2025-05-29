document.addEventListener("DOMContentLoaded", () => {
  // Check if Supabase is available
  if (typeof supabase === "undefined") {
    console.error("Supabase not available in auth.js")
    showMessage("Error: Database connection not available", "error")
    return
  }

  const authForm = document.getElementById("authForm")
  const toggleAuth = document.getElementById("toggleAuth")
  const togglePassword = document.getElementById("togglePassword")
  const signupFields = document.getElementById("signupFields")
  const submitBtn = document.getElementById("submitBtn")
  const passwordInput = document.getElementById("password")

  let isLogin = true

  // Check if user is already logged in
  checkExistingAuth()

  async function checkExistingAuth() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

        if (userData) {
          window.location.href = `${userData.role}-dashboard.html`
        }
      }
    } catch (error) {
      console.error("Error checking existing auth:", error)
    }
  }

  // Toggle between login and signup
  toggleAuth.addEventListener("click", () => {
    isLogin = !isLogin

    if (isLogin) {
      signupFields.style.display = "none"
      submitBtn.textContent = "Sign In"
      toggleAuth.textContent = "Need an account? Sign up"

      // Remove required attribute from signup fields
      document.getElementById("fullName").removeAttribute("required")
      document.getElementById("role").removeAttribute("required")
      document.getElementById("department").removeAttribute("required")
    } else {
      signupFields.style.display = "block"
      submitBtn.textContent = "Sign Up"
      toggleAuth.textContent = "Already have an account? Sign in"

      // Add required attribute to signup fields
      document.getElementById("fullName").setAttribute("required", "")
      document.getElementById("role").setAttribute("required", "")
      document.getElementById("department").setAttribute("required", "")
    }
  })

  // Toggle password visibility
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
    passwordInput.setAttribute("type", type)
    togglePassword.textContent = type === "password" ? "👁️" : "🙈"
  })

  // Handle form submission
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(authForm)
    const email = formData.get("email")
    const password = formData.get("password")

    if (!email || !password) {
      showMessage("Please fill in all required fields", "error")
      return
    }

    submitBtn.disabled = true
    submitBtn.textContent = "Loading..."

    try {
      if (isLogin) {
        // Sign in
        console.log("Attempting to sign in...")
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        })

        if (error) {
          console.error("Sign in error:", error)
          throw error
        }

        console.log("Sign in successful:", data)

        if (data.user) {
          const { data: userData } = await supabase.from("users").select("role").eq("id", data.user.id).single()

          if (userData) {
            window.location.href = `${userData.role}-dashboard.html`
          } else {
            throw new Error("User role not found")
          }
        }
      } else {
        // Sign up
        console.log("Attempting to sign up...")

        const fullName = formData.get("fullName")
        const role = formData.get("role")
        const department = formData.get("department")

        if (!fullName || !role || !department) {
          throw new Error("Please fill in all required fields")
        }

        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        })

        if (error) {
          console.error("Sign up error:", error)
          throw error
        }

        console.log("Sign up successful:", data)

        if (data.user) {
          // Insert user data
          const { error: insertError } = await supabase.from("users").insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: role,
            department: department,
          })

          if (insertError) {
            console.error("Error inserting user data:", insertError)
            throw insertError
          }

          showMessage("Registration successful! Please check your email to verify your account.", "success")

          // Switch to login mode
          isLogin = true
          signupFields.style.display = "none"
          submitBtn.textContent = "Sign In"
          toggleAuth.textContent = "Need an account? Sign up"
          authForm.reset()
        }
      }
    } catch (error) {
      console.error("Authentication error:", error)
      showMessage(`Error: ${error.message}`, "error")
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = isLogin ? "Sign In" : "Sign Up"
    }
  })
})
