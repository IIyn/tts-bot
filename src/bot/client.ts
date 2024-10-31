import {
  ChannelType,
  Client,
  GatewayIntentBits,
  type VoiceBasedChannel,
} from "npm:discord.js";
import {
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  StreamType,
  VoiceConnectionStatus,
} from "npm:@discordjs/voice";
import { createDiscordJSAdapter } from "./adapter.ts";
import say from "../textToSpeech.ts";

const player = createAudioPlayer();

const playedFiles = [];
const userToTTS = new Map<string, {
  channelId: string;
  textChannelId: string;
  guildId: string;
  playedAudios: [];
}>();

function playAudio(audio: string) {
  player.play(
    createAudioResource(
      audio,
      {
        inputType: StreamType.OggOpus,
      },
    ),
  );
  console.log("Attached recorder - ready to go!");
}

async function connectToChannel(channel: VoiceBasedChannel) {
  /**
   * Here, we try to establish a connection to a voice channel. If we're already connected
   * to this voice channel, @discordjs/voice will just return the existing connection for us!
   */
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: createDiscordJSAdapter(channel),
  });

  /**
   * If we're dealing with a connection that isn't yet Ready, we can set a reasonable
   * time limit before giving up. In this example, we give the voice connection 30 seconds
   * to enter the ready state before giving up.
   */
  try {
    /**
     * Allow ourselves 30 seconds to join the voice channel. If we do not join within then,
     * an error is thrown.
     */
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    /**
     * At this point, the voice connection is ready within 30 seconds! This means we can
     * start playing audio in the voice channel. We return the connection so it can be
     * used by the caller.
     */
    return connection;
  } catch (error) {
    /**
     * At this point, the voice connection has not entered the Ready state. We should make
     * sure to destroy it, and propagate the error by throwing it, so that the calling function
     * is aware that we failed to connect to the channel.
     */
    connection.destroy();
    throw error;
  }
}

export default function initClient(): Client<boolean> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent,
    ],
  });

  if (client === null) {
    throw new Error("Client is null !");
  }

  client.on("ready", () => {
    console.log(`Logged in as ${client?.user?.tag}!`);
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "ping") {
      await interaction.reply("Pong!");
    }

    if (interaction.commandName === "join") {
      // await joinVoiceChannel()
      const channels = await interaction.guild?.channels.fetch();

      if (channels) {
        const channel = channels.find((channel) =>
          channel?.type === ChannelType.GuildVoice
        );

        if (!channel) {
          return;
        }

        const connection = await connectToChannel(channel);
        connection.subscribe(player);
        await interaction.reply("Playing now!");
        const userId = interaction.user.id;
        if (!userToTTS.has(userId)) {
          userToTTS.set(userId, {
            channelId: channel.id,
            textChannelId: interaction.channelId,
            guildId: interaction.guildId,
            playedAudios: [],
          });
        }
      } else {
        await interaction.reply("You are not in any voice channels");
      }
    }
  });

  client.on("messageCreate", async (message) => {
    const { author } = message;

    console.log(userToTTS, message.channelId);
    const dataUser = userToTTS.get(author.id);
    if (
      userToTTS.has(author.id) && dataUser.textChannelId == message.channelId
    ) {
      const filePath = await say(message.content.toLocaleLowerCase());
      const audioArray = dataUser.playedAudios;
      audioArray.push(filePath);
      userToTTS.set(author.id, {
        ...userToTTS.get(author.id),
        playedAudios: audioArray,
      });
      playAudio(filePath);

      const channels = await message.guild?.channels.fetch();

      if (channels) {
        const channel = channels.find((channel) =>
          channel?.type === ChannelType.GuildVoice
        );

        if (!channel) {
          return;
        }

        const connection = await connectToChannel(channel);
        connection.subscribe(player);
      } else {
        await message.reply("You are not in any voice channels");
      }
    }
  });

  return client;
}
