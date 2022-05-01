const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs')

module.exports = {

	data: new SlashCommandBuilder()
		.setName('재생')
		.setDescription('다른 음악을 재생합니다.')
        .addStringOption(option => option.setName('이름').setDescription('재생할 음악의 제목').setRequired(true)),

    async execute(interaction, client, lop) {

        const name = interaction.options._hoistedOptions[0].value

        if(!interaction.member?.voice?.channel)
        {
            interaction.reply({ content: `먼저 음성 채널에 들어가 주세요.`, ephemeral: true })
            return 0
        }

        const queuee = client.distube.getQueue(interaction)
        if(queuee)
        {
            client.distube.play( interaction.member.voice.channel, name )
            interaction.reply({ content: `${name} 노래가 다음으로 재생됩니다.`, ephemeral: true })
            return name
        }
        else
        {
            interaction.reply({ content: `${name} 노래가 재생됩니다.`, ephemeral: true })

            client.distube.play( interaction.member.voice.channel, name ).then(() => {
                const channell = client.channels.cache.get(data.Id.channel)
                channell.messages.fetch(data.Id.message).then((msg) => {
                    const queuee = client.distube.getQueue(interaction)
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
                        .setTitle(`🎶 현재 ${lop}재생중 - ${name} \`${queuee.songs[0].formattedDuration}\``)
                        .setImage(queuee.songs[0].thumbnail)
                        .setFooter({ text: 'Made by - 곰곰이#7475' })
                    msg.edit({ embeds: [embed3], components: [row2]  })
                    
                })
            })
            return name
        }
    }
}