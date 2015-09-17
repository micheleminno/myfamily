-- phpMyAdmin SQL Dump
-- version 3.5.6
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Sep 17, 2015 at 03:44 PM
-- Server version: 5.5.29
-- PHP Version: 5.3.28

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `myfamily`
--

-- --------------------------------------------------------

--
-- Table structure for table `blacklist`
--

DROP TABLE IF EXISTS `blacklist`;
CREATE TABLE IF NOT EXISTS `blacklist` (
  `user` int(11) NOT NULL,
  `blocked` int(11) NOT NULL,
  `document` int(10) NOT NULL DEFAULT '-1',
  PRIMARY KEY (`user`,`blocked`,`document`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `bookmarks`
--

DROP TABLE IF EXISTS `bookmarks`;
CREATE TABLE IF NOT EXISTS `bookmarks` (
  `user` int(11) NOT NULL,
  `document` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `date` datetime NOT NULL,
  `file` varchar(100) NOT NULL,
  `owner` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=91 ;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
CREATE TABLE IF NOT EXISTS `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(100) NOT NULL,
  `entity` int(11) NOT NULL,
  `entity_type` varchar(15) NOT NULL,
  `node` int(11) NOT NULL,
  `date` datetime NOT NULL,
  `user` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=86 ;

-- --------------------------------------------------------

--
-- Table structure for table `links`
--

DROP TABLE IF EXISTS `links`;
CREATE TABLE IF NOT EXISTS `links` (
  `source` int(11) NOT NULL,
  `target` int(11) NOT NULL,
  PRIMARY KEY (`source`,`target`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `nodes`
--

DROP TABLE IF EXISTS `nodes`;
CREATE TABLE IF NOT EXISTS `nodes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(50) NOT NULL,
  `img` varchar(50) NOT NULL,
  `person` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=98 ;

-- --------------------------------------------------------

--
-- Table structure for table `node_events`
--

DROP TABLE IF EXISTS `node_events`;
CREATE TABLE IF NOT EXISTS `node_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `date` datetime NOT NULL,
  `node` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`,`node`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=27 ;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `event` int(11) NOT NULL,
  `user` int(11) NOT NULL,
  `status` tinyint(1) NOT NULL,
  PRIMARY KEY (`event`,`user`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
CREATE TABLE IF NOT EXISTS `tags` (
  `document` int(11) NOT NULL,
  `node` int(11) NOT NULL,
  `position` point DEFAULT NULL,
  PRIMARY KEY (`document`,`node`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `birthdate` varchar(10) DEFAULT NULL,
  `email` varchar(40) DEFAULT NULL,
  `credentials` varchar(50) NOT NULL,
  `node` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=69 ;

-- --------------------------------------------------------

--
-- Table structure for table `views`
--

DROP TABLE IF EXISTS `views`;
CREATE TABLE IF NOT EXISTS `views` (
  `user` int(11) NOT NULL,
  `view` int(11) NOT NULL,
  `node` int(11) NOT NULL,
  `x` int(11) NOT NULL,
  `y` int(11) NOT NULL,
  PRIMARY KEY (`user`,`view`,`node`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
