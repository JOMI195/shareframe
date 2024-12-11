export const getJokesUrl = () => "jokes/"

export const getJokeOfTheDayUrl = () => getJokesUrl() + "latest-joke-of-the-day/"

export const getJokesWithPicturesPaginatedUrl = (page: number = 1, page_size: number = 50) =>
    getJokesUrl() + `joke-of-the-days/?page=${page}&page_size=${page_size}`;

export const getSubmitJokeUrl = () => getJokesUrl() + "submit-joke/"
