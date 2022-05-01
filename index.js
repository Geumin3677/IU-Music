const { Client, Intents, MessageActionRow, MessageButton, MessageEmbed, Collection } = require('discord.js');
const ytdl = require('ytdl-core');
const { DisTube, isObject } = require('distube')
const { SpotifyPlugin } = require('@distube/spotify')
const { token } = require('./config.json')
const fs = require('fs')

const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

//커맨드 로딩
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

var list = []
var nowPlaying = ""
var isLoop = false
var lop = ""

client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    leaveOnFinish: false,
    emitAddListWhenCreatingQueue: false,
    plugins: [new SpotifyPlugin()]
})

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

client.on('messageCreate', async message => {
    if(message.content == "&@install")
    {
        const embed3 = new MessageEmbed()
            .setColor('#A931DE')
            .setTitle('재생중인 곡이 없습니다.')
            .setImage('https://img.youtube.com/vi/DTYvG_9mVlQ/maxresdefault.jpg')
            .setFooter({ text: 'Made by - 곰곰이#7475' })

        const row2 = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('Play')
                    .setStyle('SECONDARY')
                    .setEmoji('▶')
                    .setLabel('Play'),
                new MessageButton()
                    .setCustomId('Pause')
                    .setStyle('SECONDARY')
                    .setEmoji('⏯')
                    .setLabel('Pause')
                    .setDisabled(true),
                new MessageButton()
                    .setCustomId('Skip')
                    .setStyle('SECONDARY')
                    .setEmoji('⏩')
                    .setLabel('Skip')
                    .setDisabled(true),
                new MessageButton()
                    .setCustomId('Loop')
                    .setStyle('SECONDARY')
                    .setEmoji('🔁')
                    .setLabel('Loop')
                    .setDisabled(true),
                new MessageButton()
                    .setCustomId('Stop')
                    .setStyle('SECONDARY')
                    .setEmoji('⏹')
                    .setLabel('Stop')
                    .setDisabled(true)
            );
        const embed = await message.channel.send({ embeds: [embed3], components: [row2] })

        var jsonBuffer = fs.readFileSync('./data.json')
        var dataJson = jsonBuffer.toString()
        var data = JSON.parse(dataJson)

        data.Id.message = embed.id
        data.Id.channel = message.channelId

        datastr = JSON.stringify(data, null, '\t');
        fs.writeFileSync('./data.json', datastr)
    }
})

client.on('interactionCreate', async interaction => {
    try {
        if (!interaction) return

        if(interaction.isCommand())
        {
            //커맨드 불러오기
            const command = client.commands.get(interaction.commandName);
            //존재하지 않는 커맨드일시 리턴
            if (!command) return;
            //봇일시 리턴
            if(interaction.user.bot) return;
            //커맨드 실행
            
            nowPlaying =  await command.execute(interaction, client, lop);
        }

        if (interaction.isButton())
        {
            if(!interaction.member?.voice?.channel)
            {
                interaction.reply({ content: `먼저 음성 채널에 들어가 주세요.`, ephemeral: true })
                return 0
            }
            if(interaction.customId == 'Play')
            {
                const embed3 = new MessageEmbed()
                    .setColor('#FA9115')
                    .setTitle('음악을 준비중 입니다. 잠시만 기다려 주세요')
                    .setImage('https://img.youtube.com/vi/DTYvG_9mVlQ/maxresdefault.jpg')
                    .setFooter({ text: 'Made by - 곰곰이#7475' })
                interaction.update({ embeds: [embed3] })

                function shuffle(array) { array.sort(() => Math.random() - 0.5); }

                var jsonBuffer = fs.readFileSync('./data.json')
                var dataJson = jsonBuffer.toString()
                var data = JSON.parse(dataJson)

                for(const i of data.Musics)
                {
                    list.push({
                        vidname : i.videoName,
                        name : i.name
                    })
                }

                shuffle(list)

                client.distube.play( interaction.member.voice.channel, list[0].vidname).then(() => {

                    const queue = client.distube.getQueue(interaction)

                    nowPlaying = list[0].name
                    const embed3 = new MessageEmbed()
                        .setColor('#A931DE')
                        .setTitle(`🎶 현재 ${lop}재생중 - ${nowPlaying} \`${queue.songs[0].formattedDuration}\``)
                        .setImage(queue.songs[0].thumbnail)
                        .setFooter({ text: 'Made by - 곰곰이#7475' })

                    const row2 = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId('Play')
                                .setStyle('SECONDARY')
                                .setEmoji('▶')
                                .setLabel('Play')
                                .setDisabled(true),
                            new MessageButton()
                                .setCustomId('Pause')
                                .setStyle('SECONDARY')
                                .setEmoji('⏯')
                                .setLabel('Pause'),
                            new MessageButton()
                                .setCustomId('Skip')
                                .setStyle('SECONDARY')
                                .setEmoji('⏩')
                                .setLabel('Skip'),
                            new MessageButton()
                                .setCustomId('Loop')
                                .setStyle('SECONDARY')
                                .setEmoji('🔁')
                                .setLabel('Loop'),
                            new MessageButton()
                                .setCustomId('Stop')
                                .setStyle('SECONDARY')
                                .setEmoji('⏹')
                                .setLabel('Stop')
                        );

                    var jsonBuffer = fs.readFileSync('./data.json')
                    var dataJson = jsonBuffer.toString()
                    var data = JSON.parse(dataJson)
    
                    const channell = client.channels.cache.get(data.Id.channel)
                    channell.messages.fetch(data.Id.message).then((msg) => {
                        msg.edit({ embeds: [embed3], components: [row2] })
                    })
                    //interaction.update({ embeds: [embed3], components: [row2] })
                    
                    list.shift()
                })
            }
            else if (interaction.customId == 'Skip')
            {
                const queuee = client.distube.getQueue(interaction)
                if(isLoop)
                {
                    client.distube.play( interaction.member.voice.channel, queuee.songs[0].name ).then(() => {
                        client.distube.skip(interaction).then(() => {
                            const queue = client.distube.getQueue(interaction)

                            const embed3 = new MessageEmbed()
                                .setColor('#A931DE')
                                .setTitle(`🎶 현재 ${lop}재생중 - ${nowPlaying} \`${queue.songs[1].formattedDuration}\``)
                                .setImage(queue.songs[1].thumbnail)
                                .setFooter({ text: 'Made by - 곰곰이#7475' })
                            interaction.update({ embeds: [embed3] })
                        })
                    })
                    return 0
                }
                if(list.length === 0)
                {
                    function shuffle(array) { array.sort(() => Math.random() - 0.5); }
                    var jsonBuffer = fs.readFileSync('./data.json')
                    var dataJson = jsonBuffer.toString()
                    var data = JSON.parse(dataJson)

                    for(const i of data.Musics)
                    {
                        list.push({
                            vidname : i.videoName,
                            name : i.name
                        })
                    }

                    shuffle(list)
                }
                if(queuee.songs.length > 1)
                {
                    client.distube.skip(interaction).then(() => {
                        const queue = client.distube.getQueue(interaction)

                        const embed3 = new MessageEmbed()
                            .setColor('#A931DE')
                            .setTitle(`🎶 현재 ${lop}재생중 - ${nowPlaying} \`${queue.songs[1].formattedDuration}\``)
                            .setImage(queue.songs[1].thumbnail)
                            .setFooter({ text: 'Made by - 곰곰이#7475' })
                        interaction.update({ embeds: [embed3] })
                        
                        list.shift()
                    })
                }
                else
                {
                    client.distube.play( interaction.member.voice.channel, list[0].vidname ).then(() => {
                        client.distube.skip(interaction).then(() => {
                            const queue = client.distube.getQueue(interaction)

                            nowPlaying = list[0].name
                            const embed3 = new MessageEmbed()
                                .setColor('#A931DE')
                                .setTitle(`🎶 현재 ${lop}재생중 - ${nowPlaying} \`${queue.songs[1].formattedDuration}\``)
                                .setImage(queue.songs[1].thumbnail)
                                .setFooter({ text: 'Made by - 곰곰이#7475' })
                            interaction.update({ embeds: [embed3] })
                            
                            list.shift()

                            if(list.length === 0)
                            {
                                function shuffle(array) { array.sort(() => Math.random() - 0.5); }
                                var jsonBuffer = fs.readFileSync('./data.json')
                                var dataJson = jsonBuffer.toString()
                                var data = JSON.parse(dataJson)

                                for(const i of data.Musics)
                                {
                                    list.push({
                                        vidname : i.videoName,
                                        name : i.name
                                    })
                                }

                                shuffle(list)
                            }
                        })
                    })
                }
            }
            else if (interaction.customId == 'Pause')
            {
                client.distube.pause(interaction)

                const queue = client.distube.getQueue(interaction)

                const row2 = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('Play')
                            .setStyle('SECONDARY')
                            .setEmoji('▶')
                            .setLabel('Play')
                            .setDisabled(true),
                        new MessageButton()
                            .setCustomId('Resume')
                            .setStyle('SECONDARY')
                            .setEmoji('⏯')
                            .setLabel('Resume'),
                        new MessageButton()
                            .setCustomId('Skip')
                            .setStyle('SECONDARY')
                            .setEmoji('⏩')
                            .setLabel('Skip')
                            .setDisabled(true),
                        new MessageButton()
                            .setCustomId('Loop')
                            .setStyle('SECONDARY')
                            .setEmoji('🔁')
                            .setLabel('Loop')
                            .setDisabled(true),
                        new MessageButton()
                            .setCustomId('Stop')
                            .setStyle('SECONDARY')
                            .setEmoji('⏹')
                            .setLabel('Stop')
                            .setDisabled(true)
                    );

                const embed3 = new MessageEmbed()
                    .setColor('#E32120')
                    .setTitle(`⏸ 일시정지 - ${nowPlaying} \`${queue.songs[0].formattedDuration}\``)
                    .setImage(queue.songs[0].thumbnail)
                    .setFooter({ text: 'Made by - 곰곰이#7475' })
                interaction.update({ embeds: [embed3], components: [row2] })
            }
            else if (interaction.customId == 'Resume')
            {
                client.distube.resume(interaction)

                const queue = client.distube.getQueue(interaction)

                const row2 = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('Play')
                            .setStyle('SECONDARY')
                            .setEmoji('▶')
                            .setLabel('Play')
                            .setDisabled(true),
                        new MessageButton()
                            .setCustomId('Pause')
                            .setStyle('SECONDARY')
                            .setEmoji('⏯')
                            .setLabel('Pause'),
                        new MessageButton()
                            .setCustomId('Skip')
                            .setStyle('SECONDARY')
                            .setEmoji('⏩')
                            .setLabel('Skip'),
                        new MessageButton()
                            .setCustomId('Loop')
                            .setStyle('SECONDARY')
                            .setEmoji('🔁')
                            .setLabel('Loop'),
                        new MessageButton()
                            .setCustomId('Stop')
                            .setStyle('SECONDARY')
                            .setEmoji('⏹')
                            .setLabel('Stop')
                    );

                const embed3 = new MessageEmbed()
                    .setColor('#A931DE')
                    .setTitle(`🎶 현재 ${lop}재생중 - ${nowPlaying}`)
                    .setImage(queue.songs[0].thumbnail)
                    .setFooter({ text: 'Made by - 곰곰이#7475' })
                interaction.update({ embeds: [embed3], components: [row2] })
            }
            else if (interaction.customId == 'Stop')
            {
                client.distube.stop(interaction)

                isLoop = false
                lop = ""

                const embed3 = new MessageEmbed()
                    .setColor('#A931DE')
                    .setTitle('재생중인 곡이 없습니다.')
                    .setImage('https://img.youtube.com/vi/DTYvG_9mVlQ/maxresdefault.jpg')
                    .setFooter({ text: 'Made by - 곰곰이#7475' })

                const row2 = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('Play')
                            .setStyle('SECONDARY')
                            .setEmoji('▶')
                            .setLabel('Play'),
                        new MessageButton()
                            .setCustomId('Pause')
                            .setStyle('SECONDARY')
                            .setEmoji('⏯')
                            .setLabel('Pause')
                            .setDisabled(true),
                        new MessageButton()
                            .setCustomId('Skip')
                            .setStyle('SECONDARY')
                            .setEmoji('⏩')
                            .setLabel('Skip')
                            .setDisabled(true),
                        new MessageButton()
                            .setCustomId('Loop')
                            .setStyle('SECONDARY')
                            .setEmoji('🔁')
                            .setLabel('Loop')
                            .setDisabled(true),
                        new MessageButton()
                            .setCustomId('Stop')
                            .setStyle('SECONDARY')
                            .setEmoji('⏹')
                            .setLabel('Stop')
                            .setDisabled(true)
                        )
                interaction.update({ embeds: [embed3], components: [row2] })
            }
            else if (interaction.customId == 'Loop')
            {
                isLoop = !isLoop
                if(isLoop)
                {
                    lop = "반복 "
                    const queue = client.distube.getQueue(interaction)

                    const embed3 = new MessageEmbed()
                        .setColor('#A931DE')
                        .setTitle(`🎶 현재 ${lop}재생중 - ${nowPlaying} \`${queue.songs[0].formattedDuration}\``)
                        .setImage(queue.songs[0].thumbnail)
                        .setFooter({ text: 'Made by - 곰곰이#7475' })
                    interaction.update({ embeds: [embed3] })
                }
                else
                {
                    lop = ""

                    const queue = client.distube.getQueue(interaction)

                    const embed3 = new MessageEmbed()
                        .setColor('#A931DE')
                        .setTitle(`🎶 현재 ${lop}재생중 - ${nowPlaying} \`${queue.songs[0].formattedDuration}\``)
                        .setImage(queue.songs[0].thumbnail)
                        .setFooter({ text: 'Made by - 곰곰이#7475' })
                    interaction.update({ embeds: [embed3] })
                }
            }
        }
    }
    catch(error) {
        console.log(error)
    }
});

client.distube.on("finish", async queue => {
    if(list.length === 0)
    {
        function shuffle(array) { array.sort(() => Math.random() - 0.5); }
        var jsonBuffer = fs.readFileSync('./data.json')
        var dataJson = jsonBuffer.toString()
        var data = JSON.parse(dataJson)

        for(const i of data.Musics)
        {
            list.push({
                vidname : i.videoName,
                name : i.name
            })
        }

        shuffle(list)
    }
    if(isLoop)
    {
        client.distube.play( queue.voiceChannel, queue.songs[0].name ).then(() => {
            
            var jsonBuffer = fs.readFileSync('./data.json')
            var dataJson = jsonBuffer.toString()
            var data = JSON.parse(dataJson)

            const channell = client.channels.cache.get(data.Id.channel)
            channell.messages.fetch(data.Id.message).then((msg) => {
                const queuee = client.distube.getQueue(queue)
                const embed3 = new MessageEmbed()
                    .setColor('#A931DE')
                    .setTitle(`🎶 현재 ${lop}재생중 - ${nowPlaying} \`${queuee.songs[0].formattedDuration}\``)
                    .setImage(queuee.songs[0].thumbnail)
                    .setFooter({ text: 'Made by - 곰곰이#7475' })
                msg.edit({ embeds: [embed3] })
            })
        })
    }
    else
    {
        client.distube.play( queue.voiceChannel, list[0].vidname ).then(() => {
            var jsonBuffer = fs.readFileSync('./data.json')
            var dataJson = jsonBuffer.toString()
            var data = JSON.parse(dataJson)

            const channell = client.channels.cache.get(data.Id.channel)
            channell.messages.fetch(data.Id.message).then((msg) => {
                nowPlaying = list[0].name
                const queuee = client.distube.getQueue(queue)
                const embed3 = new MessageEmbed()
                    .setColor('#A931DE')
                    .setTitle(`🎶 현재 ${lop}재생중 - ${nowPlaying} \`${queuee.songs[0].formattedDuration}\``)
                    .setImage(queuee.songs[0].thumbnail)
                    .setFooter({ text: 'Made by - 곰곰이#7475' })
                msg.edit({ embeds: [embed3] })

                list.shift()
            });
        })
    }
});

// Login to Discord with your client's token
client.login(token);