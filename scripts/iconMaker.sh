#!/bin/bash

# pass in the file you want that will serve as a template for the icons
# do not include the extension

convert $1.png -resize 16x16\! $1_16.png;
convert $1.png -resize 48x48\! $1_48.png;
convert $1.png -resize 128x128\! $1_128.png; 
