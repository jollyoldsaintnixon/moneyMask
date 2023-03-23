#!/bin/bash

# pass in the file you want that will serve as a template for the icons

# check if the input argument is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <image_file>"
    exit 1
fi

# check if the input file exists
if [ ! -f "$1" ]; then
    echo "File not found: $1"
    exit 1
fi

# strip out the extension
# remove the shortest suffix after the last '.'
name="${1%.*}"
# remove the longest prefix before the first '.'
ext="${1##*.}"

# set the output dimensions
dimensions=("16" "48" "128")

# loop through the dimensions and resize the image
for dim in "${dimensions[@]}"; do
    convert ${name}.${ext} -resize ${dim}x${dim}\! ${name}-${dim}.${ext};
done
