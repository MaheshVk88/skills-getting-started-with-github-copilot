document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear and reset activity select dropdown
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants markup
        let participantsMarkup = "<p><strong>Participants:</strong></p>";
        if (details.participants && details.participants.length > 0) {
          participantsMarkup += '<ul class="participant-list">';
          details.participants.forEach(email => {
            participantsMarkup += `<li class="participant-item">${email}<span class="delete-icon" data-activity="${name}" data-email="${email}">✖</span></li>`;
          });
          participantsMarkup += '</ul>';
        } else {
          participantsMarkup += '<p class="no-participants">None yet</p>';
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsMarkup}
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers to any icons we just created
        activityCard.querySelectorAll('.delete-icon').forEach(icon => {
          icon.addEventListener('click', async () => {
            const act = icon.getAttribute('data-activity');
            const mail = icon.getAttribute('data-email');
            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(act)}/participants?email=${encodeURIComponent(mail)}`,
                { method: 'DELETE' }
              );
              const resjson = await resp.json();
              if (resp.ok) {
                messageDiv.textContent = resjson.message;
                messageDiv.className = 'success';
                // refresh list to reflect removal
                fetchActivities();
              } else {
                messageDiv.textContent = resjson.detail || 'Unable to remove participant';
                messageDiv.className = 'error';
              }
            } catch (err) {
              messageDiv.textContent = 'Error communicating with server';
              messageDiv.className = 'error';
              console.error('remove error', err);
            }
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // refresh to show new participant and updated availability
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
