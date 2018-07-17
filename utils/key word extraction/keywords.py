from summa.summarizer import summarize
from summa import keywords
import unicodedata
from os import listdir


def format_text(filename):
    with open(filename) as f:
        try:
            s = unicodedata.normalize('NFC', f.read())
        except UnicodeDecodeError:
            print("Unicode cannot be decoded for ", filename)
            return ""
    return s

folder = "../articles/"
directory = listdir(folder)
for filename in directory:
    text = format_text(folder + filename)
    kw = keywords.keywords(text)
    print("keywords for ", folder + filename, " are ", kw)
