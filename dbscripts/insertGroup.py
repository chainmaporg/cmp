##===========================================================================================================
# 					Rabstar Content Management  
#					Author: George Zhao
#					Created Date: 7/14/2018
#
##===========================================================================================================
import csv
import sys
import json

## Service
## ---------------------------------------------------------------------------------------
class ContentClass:
	grouptype=""
	name=""
	description=""
	link=""
	created=""
	
	


def generateInsStatement(grouptype, filename):
	list=[]
	if(grouptype=='facebook'):
		list=readFromFacebookCsv(filename)
	if(grouptype=='telegram'):
		list=readFromTelegramCsv(filename)
	if(grouptype=='reddit'):
		list=readFromRedditCsv(filename)
			
	for content in list:
		a="INSERT INTO socialgroup (grouptype, followers, description, link, created) "
		b="VALUES("
		c="'"+content.grouptype+"',"+"'"+content.followers+"',"+"'"+content.description+"',"+"'"+content.link+"',"+content.created
		d=")"
		print a+b+c+d
	


## Implementation
## ---------------------------------------------------------------------------------------

#Wrapper for a string which maybe do some cleanup
def rr(str):
	return str


def readFromFacebookCsv(filename):
	with open(filename, mode='r') as csvfile:
		reader = csv.reader(csvfile, quotechar='"', delimiter=',',quoting=csv.QUOTE_ALL, skipinitialspace=True)
		next(reader)
		contentList = []
		for row in reader:
			#print "======",row
			if(row[0]):
				content=ContentClass()
				content.grouptype="facebook"
				content.followers=rr(row[1]).upper().replace("K", "000")
				content.description=""
				content.link=rr(row[0])
				content.created="NOW()"

				contentList.append(content)
		return contentList
		


def readFromTelegramCsv(filename):
	with open(filename, mode='r') as csvfile:
		reader = csv.reader(csvfile, quotechar='"', delimiter=',',quoting=csv.QUOTE_ALL, skipinitialspace=True)
		#next(reader)
		contentList = []
		for row in reader:
			#print "======",row
			if(row[0]):
  				content=ContentClass()
				content.grouptype="telegram"
				content.followers=rr(row[1]).upper().replace(",", "").replace('"','')
				content.description=rr(row[0])
				content.link=rr(row[2])
				content.created="NOW()"

				contentList.append(content)
		return contentList
		
		
def readFromRedditCsv(filename):
	with open(filename, mode='r') as csvfile:
		reader = csv.reader(csvfile, quotechar='"', delimiter=',',quoting=csv.QUOTE_ALL, skipinitialspace=True)
		next(reader)
		contentList = []
		for row in reader:
			#print "======",row
			if(row[0]):
				content=ContentClass()
				content.grouptype="reddit"
				content.followers=rr(row[1]).upper().replace("K", "000")
				content.description=""
				content.link=rr(row[0])
				content.created="NOW()"


				#printRedditgroup(redditgroup)
				contentList.append(content)
		return contentList
		
		
 
def main():
   generateInsStatement('facebook','facebook-groups.csv')
   generateInsStatement('telegram','telegram-groups.csv')
   generateInsStatement('reddit','reddit-groups.csv')
 
if __name__ == '__main__':
    main()
    
    