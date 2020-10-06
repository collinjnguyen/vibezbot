const Discord = require("discord.js");
const { prefix } = require("./config.json");
const ytdl = require("ytdl-core");
const fs = require('fs');

const client = new Discord.Client();

const queue = new Map();

const emojis = [":100:", ":sunglasses:", ":triumph:", ":money_mouth:", ":fire:", ":ocean:", ":moneybag:"];
const vibeLevels = ["has **maximum** vibezzz :100:", "has **eternal** vibezzz :fire:", "is **vibin** as usual :sunglasses:", 
"**never** stops vibin :moneybag:", "could use some more **vibez** :neutral_face:", "is runnin a little **low** on vibez :slight_frown:", "has **zero** vibez :sob:", 
"has **never** had any vibez :poop:", "is **BUILT DIFFERENT** :triumph:", "is **BUILT POORLY** :clown:"];
const games = ["VALORANT", "Minecraft", "GTA", "Rocket League", "Left 4 Dead 2", "Among Us", ":thinking: NEW GAME :thinking: "];
const songs = ["https://www.youtube.com/watch?v=oQ09Bw2Q4nI", "https://www.youtube.com/watch?v=98YLWuZwSKA&ab_channel=CalvinHarris-Topic", 
"https://www.youtube.com/watch?v=KXcygf_be-Q&ab_channel=RichtheKid-Topic", "https://www.youtube.com/watch?v=sfYUdITM4Qk", "https://www.youtube.com/watch?v=1fMDjS_L2Ng&ab_channel=TazLyrics",
"https://www.youtube.com/watch?v=rVnAziBc9GM&ab_channel=Blxst-Topic"];

var vibeUsers = [];
var vibeSongs = [];
var currentSong;

client.once("ready", () => {
  console.log("Ready!");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});


// Check for valid messages and run corresponding functions
client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);
  if (message.content.startsWith(`${prefix}playvibez`)) {

    execute(message, serverQueue, null);
    return;

  } else if (message.content.startsWith(`${prefix}skipvibez`)) {

    skip(message, serverQueue);
    return;

  } else if (message.content.startsWith(`${prefix}stopvibez`)) {

    stop(message, serverQueue);
    return;

  } else if (message.content.startsWith(`${prefix}whohasthemostvibez`)) { // random vibez stuff

    mostVibes(message);
    return;

  } else if (message.content.startsWith(`${prefix}vibecheck`)) {

    vibeCheck(message, serverQueue);
    return;

  } else if (message.content.startsWith(`${prefix}whatsthevibez`)) {
        
    whatsTheVibes(message);
    return;

  } else if (message.content.startsWith(`${prefix}playavibe`)){

    playAVibe(message, serverQueue);
    return;

  } else if (message.content.startsWith(`${prefix}vibechecksomeone`)) {

    vibeCheckSomeone(message, serverQueue);
    return;

  } else if (message.content.startsWith(`${prefix}playvibelist`)) {

    playPlaylist(message, serverQueue);
    return;

  } else if (message.content.startsWith(`${prefix}thatsavibe`)) {

    upvote(message);
    return;

  } else if (message.content.startsWith(`${prefix}notavibe`)) {

    downvote(message);
    return;

  } else if (message.content.startsWith(`${prefix}fetchdata`)) {

    fetchData(message);
    return;

  } else if (message.content.startsWith(`${prefix}readdata`)) {

    readData();
    console.log(vibeUsers);
    console.log(vibeSongs);
    return;

  } else if (message.content.startsWith(`${prefix}cleardata`)) {

    clearData(true, true);
    console.log(vibeUsers);
    console.log(vibeSongs);
    return;

  } else if (message.content.startsWith(`${prefix}printtests`)) {

    console.log(vibeUsers);
    console.log(vibeSongs);
    console.log(currentSong);
    return;

  } else {
    message.channel.send("That command is not vibez enough. Try again. :clown:"); // Invalid input
  }

});

// Try to play song in VC
async function execute(message, serverQueue, chosenSong) {
    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "You need to be in a voice channel to play vibez"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "I need the permissions to join and speak in your voice channel!"
      );
    }
  
    var songInfo;

    if (chosenSong == null) {
        songInfo = await ytdl.getInfo(args[1]);
    } else {
        songInfo = await ytdl.getInfo(chosenSong);
    }

    const song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
      playedBy: message.author.username,
      level: 0,
      timesPlayed: 0
    };
  
    if (!serverQueue) {
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true
      };
  
      queue.set(message.guild.id, queueContruct);
  
      queueContruct.songs.push(song);
  
      try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message.guild, queueContruct.songs[0]);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
      }

      updateSong(message, song);

      currentSong = song;
      var isFound = false;
      var foundSong;
      vibeSongs.forEach(element => {
        if (element.url === currentSong.url) {
          isFound = true;
          foundSong = element;
        }
      })
      if (isFound) {
        currentSong = foundSong;
      } else {
        currentSong = song;
      }

      return message.channel.send(`Times Played: **${currentSong.timesPlayed}**, VibeLevel: **${currentSong.level}**`);

    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`${song.title} has been added to the vibez queue! :100:`);
    }
  }
  
  // Skip song
  function skip(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to skip the vibez :poop:"
      );
    if (!serverQueue)
      return message.channel.send("There are no vibez that I could skip! :poop:");
    serverQueue.connection.dispatcher.end();
    currentSong = null;
  }
  
  // Stop song
  function stop(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the vibez :poop:"
      );
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
    currentSong = null;
  }
  
  // Play song
  function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
  
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Now vibin to: :fire: **${song.title}** :fire:`);
  }


async function mostVibes(message) {
  const members = await message.guild.members.fetch();
        var memberList = [];
        for (const [key, value] of members.entries()) {
            if (value.user.bot == false && value.user.presence.status != "offline") {
                if (value.nickname == null) {
                    memberList.push(value.user.username);
                } else {
                    memberList.push(value.nickname);
                }
            }
        }
        var emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const vibestUser = memberList[Math.floor(Math.random() * memberList.length)];
        message.channel.send(`${emoji} ${vibestUser} has the most vibezzz ${emoji}`);
}

async function vibeCheck(message, serverQueue, user) {
  const members = await message.guild.members.fetch();
        var memberList = [];
        for (const [key, value] of members.entries()) {
            if (value.user.bot == false && value.user.presence.status != "offline") {
                if (value.nickname == null) {
                    memberList.push(value.user.username);
                } else {
                    memberList.push(value.nickname);
                }
            }
        }
        var msg = message.content.split(" ");
        var playerToBeChecked = msg[1];
        
        if (memberList.includes(playerToBeChecked)) {
            const vibeLevel = vibeLevels[Math.floor(Math.random() * vibeLevels.length)]
            message.channel.send(`${playerToBeChecked} ${vibeLevel}`);
        } else {
            message.channel.send(`That person does not exist so there are no vibez :poop:`);
        }

        // if (playerToBeChecked == "justynekyle" || user == "justynekyle" ) {
        //   await execute(message, serverQueue, "https://www.youtube.com/watch?v=NNiTxUEnmKI");
        //   await serverQueue.connection.dispatcher.end();
        // } else if (playerToBeChecked == "chhengsta" || user == "chhengsta" ) {
        //   await execute(message, serverQueue, "https://www.youtube.com/watch?v=x2_z4iSb0qI");
        //   await  serverQueue.connection.dispatcher.end();
        // } else if (playerToBeChecked == "JellyJai" || user == "JellyJai" ) {
        //   await execute(message, serverQueue, "https://m.youtube.com/watch?v=bSJV1pIzoxg");
        //   await serverQueue.connection.dispatcher.end();
        // } else if (playerToBeChecked == "KevinGetsActive" || user == "KevinGetsActive" ) {
        //   await execute(message, serverQueue, "https://youtu.be/R1ZFnbntcJI");
        //   await serverQueue.connection.dispatcher.end();
        // } else if (playerToBeChecked == "derasa" || user == "derasa" ) {
        //   await execute(message, serverQueue, "https://www.youtube.com/watch?v=fyIcQ1Xl-rs");
        //   await serverQueue.connection.dispatcher.end();
        // } else if (playerToBeChecked == "TrillTim" || user == "TrillTim" ) {
          
        // } else if (playerToBeChecked == "Dimezs" || user == "Dimezs" ) {
          
        // }

}

async function whatsTheVibes(message) {
  message.channel.send(`The current vibe is... `);
        var emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const chosenVibe = games[Math.floor(Math.random() * games.length)]
        message.channel.send(`${emoji} **${chosenVibe}** ${emoji}`);
}

async function playAVibe(message, serverQueue) {
    const chosenVibe = songs[Math.floor(Math.random() * songs.length)]
    await execute(message, serverQueue, chosenVibe);
}

async function vibeCheckSomeone(message, serverQueue) {
    const user = getRandomUser(message);


}

async function playPlaylist(message) {

}

async function upvote(message) {
  if (currentSong != null) {

    var isFound = false;
    var foundSong;
    vibeSongs.forEach(element => {
      if (element.url === currentSong.url) {
        isFound = true;
        foundSong = element;
      }
    })
    if (isFound) {
      foundSong.level++;
    } 

    const author = message.author.username;
    const songTitle = currentSong.title;
    message.channel.send(`${author} says **${songTitle}** is a vibe! :fire:`);
    message.channel.send(`VibeLevel: **${foundSong.level}**`);
    writeData();
  }
}

async function downvote(message) {
  if (currentSong != null) {
    
    var isFound = false;
    var foundSong;
    vibeSongs.forEach(element => {
      if (element.url === currentSong.url) {
        isFound = true;
        foundSong = element;
      }
    })
    if (isFound) {
      foundSong.level--;
    } 

    const author = message.author.username;
    const songTitle = currentSong.title;
    message.channel.send(`${author} says **${songTitle}** is not a vibe! :poop:`);
    message.channel.send(`VibeLevel: **${foundSong.level}**`);
    writeData();
  }
}

function createUser(message, username) {
  const user = {
    username: username,
    server: message.guild.id,
    songs: [],
    level: 0,
    timesVibeChecked: 0,
    songsPlayed: 0,
    themeSong: ""
  }
  vibeUsers.push(user);
}

function updateUser(user) {

}

function updateSong(message, song) {
  var isFound = false;
  var foundSong;
  vibeSongs.forEach(element => {
    if (element.url === song.url) {
      isFound = true;
      foundSong = element;
    }
  })
  if (!isFound) {
    vibeSongs.push(song);
  } else {
    foundSong.timesPlayed++;
  }


  var songFound = false;
  vibeUsers.forEach(user => {
    user.songs.forEach(userSong => {
      if (userSong.url === song.url) {
        songFound = true;
        userSong.timesPlayed++;
      }
    })
  });

  if (!songFound) {
    let currentUser = vibeUsers.find(user => user.username === song.playedBy);
    currentUser.songs.push(song);
  } 

  let currentUser = vibeUsers.find(user => user.username === song.playedBy);
  currentUser.songsPlayed++;

  writeData();
}

function writeData() {
  fs.writeFile('./userData.txt', JSON.stringify(vibeUsers), function (err) {
    if (err) return console.log(err);
    console.log('Updated userData.txt');
  });
  fs.writeFile('./songData.txt', JSON.stringify(vibeSongs), function (err) {
    if (err) return console.log(err);
    console.log('Updated songData.txt');
  });
}

function readData() {
  fs.readFile('./userData.txt', 'utf8' , (err, data) => {
    if (err) return console.log(err)
    vibeUsers = JSON.parse(data);
  })
  fs.readFile('./songData.txt', 'utf8' , (err, data) => {
    if (err) return console.log(err)
    vibeSongs = JSON.parse(data);
  })
}

async function fetchData(message) {
  const members = await message.guild.members.fetch();
  var memberList = [];
  for (const [key, value] of members.entries()) {
    if (value.user.bot == false && value.user.presence.status != "offline") {
      if (value.nickname == null) {
        memberList.push(value.user.username);
      } else {
        memberList.push(value.nickname);
      }
    }
  }
  memberList.forEach(element => {
    createUser(message, element);
  })
  writeData();
}

async function getRandomUser(message) {
  const members = await message.guild.members.fetch();
        var memberList = [];
        for (const [key, value] of members.entries()) {
            if (value.user.bot == false && value.user.presence.status != "offline") {
                if (value.nickname == null) {
                    memberList.push(value.user.username);
                } else {
                    memberList.push(value.nickname);
                }
            }
        }

      return memberList[Math.floor(Math.random() * memberList.length)];
}

function clearData(users, songs) {
  if (users) {
    fs.writeFile('./userData.txt', "", function (err) {
      if (err) return console.log(err);
      console.log('Updated userData.txt');
    });
    vibeUsers = [];
  } else if (songs) {
    fs.writeFile('./songData.txt', "", function (err) {
      if (err) return console.log(err);
      console.log('Updated songData.txt');
    });
    vibeSongs = [];
  }
}

fs.readFile('./token.txt', 'utf-8', (err, data) => {
  if (err) throw err;
  readData();
  client.login(data.toString());
})

