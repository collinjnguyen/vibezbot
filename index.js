const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");

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

    execute(message, serverQueue);
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

    vibeCheck(message);
    return;

  } else if (message.content.startsWith(`${prefix}whatsthevibez`)) {
        
    whatsTheVibes(message);
    return;

  } else if (message.content.startsWith(`${prefix}playavibe`)){

    playAVibe(message, serverQueue);
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
        "You need to be in a voice channel to play music!"
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
      url: songInfo.videoDetails.video_url
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
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`${song.title} has been added to the vibez queue! :100:`);
    }
  }
  
  // Skip song
  function skip(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the vibez! :poop:"
      );
    if (!serverQueue)
      return message.channel.send("There is no vibez that I could skip! :poop:");
    serverQueue.connection.dispatcher.end();
  }
  
  // Stop song
  function stop(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to vibe! :poop:"
      );
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
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

async function vibeCheck(message) {
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

client.login(token);