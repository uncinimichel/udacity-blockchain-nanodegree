
function removeUndefined(val) {
    return Object.keys(val).reduce(function(acc, key) {
        if(val[key] != undefined){
            acc[key] = val[key]
        }
        return acc;
        }, {})
}

module.exports = {

    encodeStar: function (rawStar) {
        ({ma, co, dec, ra, star_story} = rawStar);
        if (!star_story || star_story.length > 250) {
            throw new Error("star_story is a mandatory field of <= 250 characters");
        }
        if (!dec || !ra){
            throw new Error("dec and ra is a mandatory field");

        }
        else {
            let storyEncoded = new Buffer(star_story);
            let star = {magnitude: ma, constellation: co, declination: dec, right_ascension: ra, story: storyEncoded.toString('hex')}
            return {star : removeUndefined(star)};
        }
    },

    decodeStar: function(encodedStar) {

        ({magnitude, constellation, declination, right_ascension, story} = encodedStar);

        let star = {ma: magnitude,
                    co: constellation,
                    dec: declination,
                    ra: right_ascension,
                    story: story,
                    storyDecoded: Buffer.from(story,'hex').toString()}

        return star;
    }
};

