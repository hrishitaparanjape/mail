document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#save_email').addEventListener('click', save_email);


  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      let emailsHTML = '';
      emails.forEach(email => {
        emailsHTML += `
          <div class="email-box" 
               style="border: 1px solid black; margin: 5px; padding: 10px; background-color: ${email.read ? 'gray' : 'white'};"
               onclick="load_email(${email.id})">
            <strong>From:</strong> ${email.sender} <br>
            <strong>Subject:</strong> ${email.subject} <br>
            <strong>Timestamp:</strong> ${email.timestamp}
          </div>
        `;
      })

      document.querySelector('#emails-view').innerHTML += emailsHTML;
    })

    .catch(error => console.log('Error:', error));
}

function load_email(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'block';

  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      document.querySelector('#email-detail-view').innerHTML = `
        <button onclick="load_mailbox('inbox')">Back to Inbox</button> 
        <button id="archive-button"></button>
        <button id="reply-button">Reply</button>
        <br> <br>
        <strong>From:</strong> ${email.sender} <br>
        <strong>To:</strong> ${email.recipients.join(', ')} <br>
        <strong>Subject:</strong> ${email.subject} <br>
        <strong>Timestamp:</strong> ${email.timestamp} <br><br>
        <p>${email.body}</p>
      `;

      const archiveButton = document.querySelector('#archive-button');
      if (email.archived) {
        archiveButton.innerText = 'Unarchive';
        archiveButton.onclick = () => {
          fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: false }),
          })
            .then(() => load_mailbox('inbox')) // Reload inbox
            .catch(error => console.log('Error:', error));
        };
      } else {
        archiveButton.innerText = 'Archive';
        archiveButton.onclick = () => {
          fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: true }),
          })
            .then(() => load_mailbox('inbox')) // Reload inbox
            .catch(error => console.log('Error:', error));
        };
      }

      if (!email.read) {
        fetch(`/emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({ read: true }),
        }).catch(error => console.log('Error:', error));
      }

      const replyButton = document.querySelector('#reply-button');
      replyButton.onclick = () => reply_to_email(email);
    })
    .catch(error => console.log('Error:', error));
}

function reply_to_email(email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail-view').style.display = 'none';
  document.querySelector('#compose-recipients').value = email.sender;

  let subject = email.subject;
  if (!subject.startsWith("Re: ")) {
    subject = "Re: " + subject;
  }
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = `--- On ${email.timestamp}, ${email.sender} wrote:\n${email.body}\n\n ---`;
}

function save_email(event) {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.getElementById('compose-recipients').value,
      subject: document.getElementById('compose-subject').value,
      body: document.getElementById('compose-body').value,
    })
  })
    .then(response => response.json())
    .then(result => {
      console.log(result);
    })
    .catch(error => {
      console.log('Error:', error);
    });
}
