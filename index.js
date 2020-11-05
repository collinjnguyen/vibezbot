const { Client, Intents } = require("discord.js");
const { prefix } = require("./config.json");
const ytdl = require("ytdl-core");
const fs = require('fs');
const yts = require("yt-search");
const cleverbot = require('cleverbot-free');

const intents = new Intents([
  Intents.NON_PRIVILEGED, // include all non-privileged intents, would be better to specify which ones you actually need
  "GUILD_MEMBERS", // lets you request guild members (i.e. fixes the issue)
]);

const client = new Client({ ws: { intents } });

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

  } else if (message.content.startsWith(`${prefix}whohastheleastvibez`)) { // random vibez stuff

    leastVibes(message);
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

  } else if (message.content.startsWith(`${prefix}vibezbot`)) {

    ask(message);
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

    var songTitle;
    var songUrl;
    var songThumbnail;
    var songDescription;
    var songAuthor;
    var songDuration;

    var isSearched;

    if (chosenSong == null) {
        // songInfo = await ytdl.getInfo(args[1]);
        if (ytdl.validateURL(args[1])) {
          songInfo = await ytdl.getInfo(args[1]);
          isSearched = false;
        } else {
          const {videos} = await yts(args.slice(1).join(" "));
          if (!videos.length) return message.channel.send("No vibez were found!");
          songTitle = videos[0].title;
          songUrl = videos[0].url;
          songThumbnail = videos[0].thumbnail_url;
          songAuthor = videos[0].author.name;
          songDuration = videos[0].timestamp;
          isSearched = true;
        }
    } else {
        songInfo = await ytdl.getInfo(chosenSong);
    }

    var song = {
      title: " ",
      url: " ",
      thumbnail: " ",
      description: " ",
      author: " ",
      duration: " ",
      playedBy: message.author.username,
      level: 0,
      timesPlayed: 0
    };

    if (!isSearched) {
      song.title = songInfo.videoDetails.title;
      song.url = songInfo.videoDetails.video_url;
      song.thumbnail = songInfo.videoDetails.thumbnail_url;
      song.author = songInfo.videoDetails.author;
    } else {
      song.title = songTitle;
      song.url = songUrl;
      song.thumbnail = songThumbnail;
      song.author = songAuthor;
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
        play(message.guild, queueContruct.songs[0], songInfo);
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
  function play(guild, song, songInfo) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
  
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url, {quality: 'highestaudio', highWaterMark: 1 << 25 }))
      .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Now vibin to: :fire: **${song.title}** :fire:`);
    // serverQueue.textChannel.send(generateSongEmbed(song));
    // Working on creating an embed message 
  }


async function mostVibes(message) {
  const members = await message.guild.members.fetch();
  var memberList = [];
  for (const [key, value] of members.entries()) {
      if (/*value.user.bot == false && value.user.presence.status != "offline"*/true) {
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
  if (vibestUser == "VibezBot") {
    message.channel.send(`CMONNNN`);
  }
}

async function leastVibes(message) {
  message.channel.send(`trillesttim has the least vibez :poop:`);
}

async function vibeCheck(message, serverQueue, user) {
  const members = await message.guild.members.fetch();
  var memberList = [];
  for (const [key, value] of members.entries()) {
      if (/*value.user.bot == false && value.user.presence.status != "offline"*/true) {
          if (value.nickname == null) {
              memberList.push(value.user.username.toLowerCase());
          } else {
              memberList.push(value.nickname.toLowerCase());
          }
      }
  }

  const channels = await message.guild.channels;
  var channelList = [];
  
  //console.log(channels);
  
  if (!message.content.includes(",")) {
    var msg = message.content.split(" ");
    var playerToBeChecked;
    if (msg.length > 2) {
      playerToBeChecked = "";
      for (var i = 1; i < msg.length; i++) {
        playerToBeChecked = playerToBeChecked + msg[i] + " ";
      }
      playerToBeChecked = playerToBeChecked.trim().toLowerCase();
    } else {
      playerToBeChecked = msg[1].toLowerCase();
    }

    if (memberList.includes(playerToBeChecked)) {
        const vibeLevel = vibeLevels[Math.floor(Math.random() * vibeLevels.length)]
        message.channel.send(`${playerToBeChecked} ${vibeLevel}`);
    } else {
        message.channel.send(`That person does not exist so there are no vibez :poop:`);
    }
  } else {
    let playersToBeChecked = [];
    var msg = message.content.split(",");
    msg[0] = msg[0].substring(10, msg[0].length);
    msg.forEach(element => {
      if (element.includes(",")) {
        playersToBeChecked.push(element.substring(0, element.length-1).trim());
      } else {
        playersToBeChecked.push(element.trim());
      }
    });
    playersToBeChecked.forEach(element => {
      if (memberList.includes(element)) {
        const vibeLevel = vibeLevels[Math.floor(Math.random() * vibeLevels.length)]
        message.channel.send(`${element} ${vibeLevel}`);
    } else {
        message.channel.send(`That person does not exist so there are no vibez :poop:`);
    }
    });
  }

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

function generateSongEmbed(song) {
  const embed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle(song.title)
    .setURL(song.url)
    .setAuthor('Now vibin to:')
    .setDescription(song.description)
    .setThumbnail(song.thumbnail)
    .addFields(
      { name: 'Channel', value: song.author, inline: true },
      { name: 'Duration', value: song.duration, inline: true },
    )
    .setImage(song.thumbnail)
    .setTimestamp()
    .setFooter('VibezBot KP CMONNN');
    return embed;
}

async function ask(message) {
  const modifiedMessage = message.content.substring(10, message.content.length);
  cleverbot(modifiedMessage)
    .then(response => {
      message.channel.send(`${response}`);
    });
}

fs.readFile('./token.txt', 'utf-8', (err, data) => {
  if (err) throw err;
  readData();
  client.login(data.toString());
})

