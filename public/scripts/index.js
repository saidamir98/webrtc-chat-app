const { RTCPeerConnection, RTCSessionDescription } = window;

const peerConnection = new RTCPeerConnection();

function unselectUsersFromList() {
  const alreadySelectedUser = document.querySelectorAll(
    '.active-user.active-user--selected'
  );

  alreadySelectedUser.forEach((el) => {
    el.setAttribute('class', 'active-user');
  });
}

function createUserItemContainer(user) {
  const userContainerEl = document.createElement('div');
  userContainerEl.setAttribute('class', 'active-user');
  userContainerEl.setAttribute('id', user.id);

  const usernameEl = document.createElement('p');
  usernameEl.setAttribute('class', 'username');
  usernameEl.innerHTML = user.username;
  userContainerEl.appendChild(usernameEl);

  const callBtn = document.createElement('button');
  callBtn.innerHTML = 'call';
  userContainerEl.appendChild(callBtn);

  callBtn.addEventListener('click', () => {
    var userData = user;
    unselectUsersFromList();
    document
      .getElementById(userData.id)
      .setAttribute('class', 'active-user active-user--selected');
    document.getElementById(
      'talking-with-info'
    ).innerHTML = `Talking with: ${userData.username}`;
    callUser(userData);
  });

  return userContainerEl;
}

async function callUser(user) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

  socket.emit('call', {
    offer: offer,
    to: user.id,
  });
}

let me;

let io_url = 'localhost:5000';
let url_string = window.location.href;
let url = new URL(url_string);
const name = url.searchParams.get('name');
if (name) {
  console.log(name);
  io_url = io_url + '/' + name;
}
const socket = io.connect(io_url);

function test() {
  socket.emit('update-username', {
    username: 'username',
  });
}

setTimeout(test, 3000);

socket.on('joined', (data) => {
  me = data.me;
  const activeUserContainer = document.getElementById('active-user-container');
  data.users.forEach((user) => {
    if (user.id != me.id) {
      const userContainerEl = createUserItemContainer(user);
      activeUserContainer.appendChild(userContainerEl);
    }
  });
});

socket.on('joined-user', (user) => {
  const activeUserContainer = document.getElementById('active-user-container');
  const userContainerEl = createUserItemContainer(user);
  activeUserContainer.appendChild(userContainerEl);
});

socket.on('updated-user', (user) => {
  let el = document.getElementById(user.id);
  if (el) {
    el.remove();
  }
  const activeUserContainer = document.getElementById('active-user-container');
  const userContainerEl = createUserItemContainer(user);
  activeUserContainer.appendChild(userContainerEl);
});

socket.on('removed-user', (user) => {
  const elToRemove = document.getElementById(user.id);
  if (elToRemove) {
    elToRemove.remove();
  }
});

socket.on('calling', async (data) => {
  // var confirmed = window.confirm(
  //   `${data.username}" wants to call you. Do accept this call?`
  // );

  if (true) {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

    unselectUsersFromList();
    document
      .getElementById(data.from)
      .setAttribute('class', 'active-user active-user--selected');

    socket.emit('answer', {
      answer: answer,
      to: data.from,
    });
  } else {
    socket.emit('notify', {
      to: data.from,
      message: `User: "${data.username}" rejected your call.`,
    });
  }
});

socket.on('answered', async (data) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );

  // unselectUsersFromList();
  // document.getElementById(data.from).className =
  //   '.active-user.active-user--selected';

  // if (!isAlreadyCalling) {
  //   callUser(data.socket);
  //   isAlreadyCalling = true;
  // }
});

socket.on('notified', (data) => {
  alert(data.message);
  // unselectUsersFromList();
});

peerConnection.ontrack = function ({ streams: [stream] }) {
  const remoteVideo = document.getElementById('remote-video');
  if (remoteVideo) {
    remoteVideo.srcObject = stream;
  }
};

navigator.getUserMedia(
  { video: true, audio: true },
  (stream) => {
    const localVideo = document.getElementById('local-video');
    if (localVideo) {
      localVideo.srcObject = stream;
    }

    stream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, stream));
  },
  (error) => {
    console.warn(error.message);
  }
);
