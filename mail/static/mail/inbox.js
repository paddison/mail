document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', event => submit_email(event));

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(result => {
    result.forEach(email => {
      console.log(email)
      // Create a div to hold each email
      const emailWrapper = document.createElement("div");
      emailWrapper.setAttribute("id", `email ${email.id}`);
      emailWrapper.setAttribute("data-id", email.id.toString());
      emailWrapper.setAttribute("data-mailbox", mailbox);
      if (email.read === false) {
        emailWrapper.setAttribute("class", "mailbox-email-wrapper");
      } else {
        emailWrapper.setAttribute("class", "mailbox-email-wrapper read");
      } 

      // divide it into two parts: 
      // First for sender and subject
      const emailInfoWrapper = document.createElement("div");
      emailInfoWrapper.setAttribute("class", "mailbox-info-wrapper");
      emailInfoWrapper.innerHTML = `<b>${email.sender}</b> ${email.subject}`
      emailWrapper.append(emailInfoWrapper);

      // one for the date
      const emailDateWrapper = document.createElement("div");
      emailDateWrapper.setAttribute("class", "mailbox-date-wrapper");
      emailDateWrapper.innerHTML = email.timestamp;
      emailWrapper.append(emailDateWrapper);

      // add eventlistener for viewing a single email
      emailWrapper.addEventListener("click", display_email);

      // append the wrapper div
      document.querySelector("#emails-view").append(emailWrapper);
    });
  })
  .catch(err => {
    console.log(err)
  })

}

function submit_email(event) {
  event.preventDefault();
  console.log("posted");
  
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result)
    load_mailbox('sent');
  })
  .catch(err => {
    console.log(err)
  })
  
  

}

function display_email() {
  console.log(event)
  fetch(`/emails/${this.dataset.id}`)
  .then(response => response.json())
  .then(result => {
    
    // Show Email View and hide other Views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';

    // show email info
    document.querySelector('#email-info').innerHTML = 
    `<b>From: </b>${result.sender}<br>
    <b>To: </b>${result.recipients.join(", ")}<br>
    <b>Subject: </b>${result.subject}</br>
    <b>Timestamp: </b>${result.timestamp}`;

    // show archive button, depending on mailbox
    const archiveBtn = document.querySelector("#archive");
    archiveBtn.setAttribute("data-id", this.dataset.id.toString());
    archiveBtn.setAttribute("data-archived", result.archived);
    archiveBtn.style.display = "inline-block";
    if (this.dataset.mailbox === "inbox") { 
      archiveBtn.innerHTML = "Archive";
    } else if (this.dataset.mailbox === "archive") {
      archiveBtn.innerHTML = "Unarchive";
    } else {
      archiveBtn.style.display = "none";
    }
    archiveBtn.addEventListener("click", archive_email);
    
    
    // add eventlistener for reply button
    document.querySelector("#reply").addEventListener("click", () => respond_email(result));

    // show email body
    document.querySelector('#email-body').innerHTML = result.body

    // mark the email as read
    fetch(`/emails/${result.id}`, {
      method: "PUT",
      body: JSON.stringify({
        read: true
      })
    })
    .then(response => response)
    .then(result => {
      console.log(result);
    })
    .catch(err => {
      console.log(err);
    });
    
  })
  .catch(err => {
    console.log(err)
  });
}

function archive_email() {

  fetch(`/emails/${this.dataset.id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: (this.dataset.archived === "true") ? false : true
    })
  })
  .then(response => response)
  .then(result => {
    load_mailbox('inbox');
  })
  .catch(err => {
    console.log(err);
  });
}

function respond_email(email) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
  
  
    // Fill out composition fields
    document.querySelector('#compose-recipients').value = email.sender;

    // see if the email subject starts with "Re: "
    const testRegex = /^Re: /i
    if (testRegex.test(email.subject)) {
      document.querySelector('#compose-subject').value = email.subject;
    } else {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
    document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n\n${email.body}`;
}