// Studio details shown on the demo. Change these in one place.
export const STUDIO = {
  name: "WebNest Studio",
  // Facebook page ID or username, used for the Messenger links.
  page: "61594388112794",
  facebook: "https://www.facebook.com/profile.php?id=61594388112794",
};

// Opens a Messenger chat with the page, with the message already typed.
export const messengerLink = (text: string, page: string = STUDIO.page) =>
  `https://m.me/${page}?text=${encodeURIComponent(text)}`;
