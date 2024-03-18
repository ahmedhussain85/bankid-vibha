$(document).ready(function() {
  // Handle click event on links with hash fragments
  $('a[href^="#"]').on('click', function(event) {
    // Prevent default anchor click behavior
    event.preventDefault();

    // Get the target element's ID from the href attribute
    var target = $(this).attr('href');
    target = target.replace("#","/");
    
    // Load the content dynamically
    loadContent(target);
  });
});

function loadContent(target) {
  // Send an AJAX request to fetch the content of the target
  $.ajax({
    url: target, // URL to fetch the content
    method: 'GET',
    success: function(data) {
      // On success, inject the content into the main-content area
      $('#main-content').html(data);
    },
    error: function(xhr, status, error) {
      console.error('Error loading content:', error);
    }
  });
}
