export const minimizeName = (name: string, length: number = 30) =>
    name.length > length
        ? name.slice(0, length - 5) + '…' + name.slice(name.length-4)
        : name;

export const capitalized = (word: string) => 
    word[0].toUpperCase() + word.slice(1);
