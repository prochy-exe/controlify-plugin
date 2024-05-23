# Controlify-plugin

A plugin for [Spicetify](https://spicetify.app/) that connects to [Controlify](https://github.com/prochy-exe/controlify)

## Features

- Customizable retry count and timeout for connection to Controlify
- Customizable amount of volume steps (it's very difficult to explain but basically how many steps are taken out of a hundred on the increase/decrease volume event)

## Installation
- Make sure you have [Spicetify](https://spicetify.app/)
- When you do, you should be able to find this plugin on the marketplace, otherwise follow these steps:
    1. Download the .js [file](https://https://github.com/prochy-exe/controlify-plugin/blob/main/dist/controlify-plugin.js)
    2. Move it to Spicetify's extension folder (more info on their site)
    3. Open up the terminal and type ```spicetify config extensions controlify-plugin.js``` 
    4. Afterwards ```spicetify apply```, your Spotify should restart
    5. Head on over to Spotify's settings, scroll down and look for the Controlify section
    6. Configure it to your liking and you are set! \
    (Keep in mind that Controlify is required for this to work)

## Usage

The primary and only usage of this plugin is to allow the user to control Spotify in a way they want. This system doesn't rely on global shortcuts set by the OS, so session interference can be easily avoided (i love getting my eardrums destroyed by youtube while trying to pause Spotify while doing some pro gaming -_-)

## Contributing

Pull requests are always welcome, so if you have any feature suggestions or fixes please feel free to submit them!

## Made with Spicetify Creator
- https://github.com/spicetify/spicetify-creator