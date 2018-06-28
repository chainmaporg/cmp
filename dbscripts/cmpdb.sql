DROP TABLE IF EXISTS `challenge`;
CREATE TABLE `challenge` (
  `challenge_id` int(15) NOT NULL AUTO_INCREMENT,
  `post_user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `upvote_count` int(8) NOT NULL DEFAULT '0',
  `downvote_count` int(8) NOT NULL DEFAULT '0',
  `view_count` int(8) NOT NULL DEFAULT '0',
  `category` varchar(20) NOT NULL,
  `level` varchar(20) NOT NULL,
  `time_estimation` varchar(20) NOT NULL,
  `posting_date` datetime NOT NULL,
  PRIMARY KEY (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `materials`;
CREATE TABLE `materials` (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`type` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
	`description` varchar(300) COLLATE utf8_unicode_ci NOT NULL,
	`link` varchar(500) COLLATE utf8_unicode_ci NOT NULL,
	`name` varchar(150) COLLATE utf8_unicode_ci NOT NULL,       
	`created` datetime NOT NULL,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

DROP TABLE IF EXISTS `answer`;
CREATE TABLE `answer` (
 `answer_id` int(15) NOT NULL AUTO_INCREMENT,
 `challenge_id` int(15) NOT NULL,
 `post_user_id` int(11) NOT NULL,
 `description` text NOT NULL,
 `posting_date` datetime NOT NULL,
 `upvote_count` int(8) NOT NULL DEFAULT '0',
 `downvote_count` int(8) NOT NULL DEFAULT '0',
 `view_count` int(8) NOT NULL DEFAULT '0',
 PRIMARY KEY (`answer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `user_phone` varchar(20) NOT NULL,
  `password` varchar(32) NOT NULL,
  `payment_address` varchar(255) NOT NULL DEFAULT '' COMMENT 'Not sure what should be the length of the payment address field.',
  `is_reviewer` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 => Not a reviewer, 1 => This developer is a reviewer also.',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for `company`
-- ----------------------------
DROP TABLE IF EXISTS `company`;
CREATE TABLE `company` (
  `company_id` int(11) NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `company_info` text NOT NULL,
  `company_email` varchar(255) NOT NULL,
  `company_phone` varchar(20) NOT NULL,
  `company_site` varchar(255) NOT NULL,
  PRIMARY KEY (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

