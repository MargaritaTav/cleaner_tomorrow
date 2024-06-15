function saveControlArea(region) {
  // Save to session storage
  console.log("function is working");
  sessionStorage.setItem('selectedRegion', region);

  // Prepare data for the POST request
  const postData = {
      region: region,
  };

  // Fetch region data and update UI accordingly
  fetch(`/region-data/${region}`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
  })
  .then(response => response.json())
  .then(data => {
      const controlsToHide = document.querySelectorAll('.controls-to-hide');
      const regionResultElement = document.getElementById('regionResult');
      const subscribeControls = document.getElementById('subscribeControls');

      // Toggle visibility based on data availability
      controlsToHide.forEach(el => el.classList.toggle('hidden', !data));
      subscribeControls.classList.toggle('hidden', !data);
      regionResultElement.innerHTML = ''; // Clear the existing content

      // Append h1 element for region details
      const regionDetails = document.createElement('h1');
      regionDetails.textContent = "Your region is: " + region;
      regionResultElement.appendChild(regionDetails);

      // Append p element with dynamic data if available
      if (data && data.forecast_result) {
          const forecastElement = document.createElement('p');
          forecastElement.textContent = `Forecast result: ${data.forecast_result}`;
          regionResultElement.appendChild(forecastElement);
      } else {
          regionResultElement.innerHTML = '<p>No data available for this region.</p>';
      }
  })
  .catch(error => {
      console.error('Error:', error);
      document.getElementById('regionResult').innerHTML = '<p>Error fetching data.</p>';
  });
}

document.getElementById('emailSubscriptionForm').addEventListener('submit', function (event) {
event.preventDefault();
const emailInputValue = document.getElementById('emailInput').value;
const region = sessionStorage.getItem('selectedRegion') || 'default'; // Fallback to a default value or handle as needed

// Assume a backend endpoint /subscribe for email subscriptions
fetch('/subscribe', {
  method: 'POST',
  headers: {
      'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email: emailInputValue, region }),
})
.then(response => {
  if (!response.ok) {
      // If response status code is not OK, throw an error with the status text
      throw new Error('Network response was not ok: ' + response.statusText);
  }
  document.getElementById('subscribeControls').innerHTML = '<p class="m-3">Thank you for subscribing!</p>';
  //return response.json(); // This is a Promise
})
.catch(error => {
  console.error('Subscription error:', error);
  // Update the HTML to show a more descriptive error message
  document.getElementById('subscribeControls').innerHTML = `<p class="m-3">Error processing subscription. Details: ${error.message}</p>`;
});
});