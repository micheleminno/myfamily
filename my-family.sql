-- phpMyAdmin SQL Dump
-- version 3.5.6
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jun 22, 2015 at 12:58 PM
-- Server version: 5.5.29
-- PHP Version: 5.3.28

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `my-family`
--

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE IF NOT EXISTS `documents` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `date` datetime NOT NULL,
  `file` varchar(100) NOT NULL,
  `owner` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`id`, `title`, `date`, `file`, `owner`) VALUES
(1, 'photo 1', '2008-02-15 00:00:00', 'photo_famiglia.jpg', 3),
(2, 'photo 2', '2008-04-15 00:00:00', 'photo_laurea.jpg', 3),
(3, 'photo 3', '2008-04-15 00:00:00', 'photo_mic_matt_nonna.jpg', 3),
(4, 'photo 7', '2008-04-15 00:00:00', 'laurea_2.jpg', 3),
(5, 'photo 8', '2008-04-15 00:00:00', 'laurea_3.jpg', 3),
(6, 'tailandia', '2010-07-10 00:00:00', 'thai_1.jpg', 4),
(7, 'tailandia', '2010-07-10 00:00:00', 'thai_2.jpg', 4),
(8, 'tailandia', '2010-07-10 00:00:00', 'thai_3.jpg', 4),
(9, 'tailandia', '2010-07-10 00:00:00', 'thai_4.jpg', 4),
(10, 'tailandia', '2010-07-10 00:00:00', 'thai_5.jpg', 4),
(11, 'tailandia', '2010-07-10 00:00:00', 'thai_6.jpg', 4),
(12, 'tailandia', '2010-07-10 00:00:00', 'thai_7.jpg', 4),
(13, 'tailandia', '2010-07-10 00:00:00', 'thai_8.jpg', 4),
(14, 'tailandia', '2010-07-10 00:00:00', 'thai_9.jpg', 4),
(15, 'tailandia', '2010-07-10 00:00:00', 'thai_10.jpg', 4),
(16, 'photo 16', '2014-10-08 00:00:00', 'photo_mic_zia_carla.jpg', 3),
(17, 'photo 17', '2014-11-02 00:00:00', 'photo_mic_matt.jpg', 3),
(18, 'Ricette di nonna', '2014-01-01 00:00:00', 'ricette.pdf', 3),
(19, 'Famiglia Ferrara', '2014-11-01 00:00:00', 'famiglia_ferrara.jpg', 3),
(20, 'Chi √®?', '0000-00-00 00:00:00', 'old.jpg', 3);

-- --------------------------------------------------------

--
-- Table structure for table `links`
--

CREATE TABLE IF NOT EXISTS `links` (
  `source` int(11) NOT NULL,
  `target` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `links`
--

INSERT INTO `links` (`source`, `target`) VALUES
(0, 2),
(1, 2),
(2, 3),
(2, 4),
(5, 7),
(6, 7),
(7, 0),
(7, 8),
(7, 9),
(7, 10),
(9, 12),
(11, 12),
(12, 13),
(12, 14),
(12, 15),
(10, 17),
(16, 17),
(17, 18),
(17, 19),
(8, 22),
(20, 22),
(22, 21),
(23, 25),
(24, 25),
(25, 1),
(25, 26),
(25, 27),
(27, 29),
(28, 29),
(29, 30),
(30, 32),
(31, 32),
(26, 34),
(33, 34),
(34, 35),
(34, 36),
(21, 38),
(37, 38),
(38, 39),
(35, 41),
(40, 41),
(41, 42),
(13, 44),
(43, 44),
(44, 45),
(44, 46),
(36, 50),
(47, 50),
(50, 48),
(50, 49),
(51, 53),
(52, 53),
(53, 16);

-- --------------------------------------------------------

--
-- Table structure for table `nodes`
--

CREATE TABLE IF NOT EXISTS `nodes` (
  `id` int(11) NOT NULL,
  `label` varchar(50) NOT NULL,
  `img` varchar(50) NOT NULL,
  `person` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `nodes`
--

INSERT INTO `nodes` (`id`, `label`, `img`, `person`) VALUES
(0, 'Graziella Scippa', 'graziella.png', 1),
(1, 'Francesco Minno', 'francesco_minno.png', 1),
(2, 'Graziella Scippa e Francesco Minno', '', 0),
(3, 'Michele Minno', 'profile_linkedin.jpg', 1),
(4, 'Matteo Minno', 'matteo.jpg', 1),
(5, 'Francesca Pazzaglia', 'francesca_pazzaglia.png', 1),
(6, 'Gennaro Scippa', '', 1),
(7, 'Francesca Pazzaglia e Gennaro Scippa', '', 0),
(8, 'Angela Scippa', '', 1),
(9, 'Rosetta Scippa', '', 1),
(10, 'Nicola Scippa', '', 1),
(11, 'Angelo Sbariggi', '', 1),
(12, 'Rosetta Scippa e Angelo Sbariggi', '', 0),
(13, 'Simone Sbariggi', 'simone.jpg', 1),
(14, 'Carlo Sbariggi', '', 1),
(15, 'Stefano Sbariggi', 'stefano.jpg', 1),
(16, 'Carla Lupi', 'carla.png', 1),
(17, 'Carla Lupi e Nicola Scippa', '', 0),
(18, 'Roberto Scippa', 'roberto.jpg', 1),
(19, 'Silvia Scippa', 'silvia.jpg', 1),
(20, 'Walter Cometti', '', 1),
(21, 'Raffaella Cometti', 'raffaella.jpg', 1),
(22, 'Angela Scippa e Walter Cometti', '', 0),
(23, 'Maria Candida Manzo', '', 1),
(24, 'Armando Minno', '', 1),
(25, 'Maria Candida Manzo e Armando Minno', '', 0),
(26, 'Alberto Minno', '', 1),
(27, 'Anna Minno', '', 1),
(28, 'Alfonso Fagiolo', '', 1),
(29, 'Alfonso Fagiolo e Anna Minno', '', 0),
(30, 'Giorgio Fagiolo', 'giorgio.jpg', 1),
(31, 'Martina Morici', 'martina.jpg', 1),
(32, 'Giorgio Fagiolo e Martina Morici', '', 0),
(33, 'Fiorella Bianchi', 'fiorella.png', 1),
(34, 'Alberto Minno e Fiorella Bianchi', '', 0),
(35, 'Lorenzo Minno', 'lorenzo.jpg', 1),
(36, 'Alessandra Minno', 'alessandra.jpg', 1),
(37, 'Mirko Caravaggi', '', 1),
(38, 'Mirko Caravaggi e Raffaella Cometti', '', 0),
(39, 'Daniele Caravaggi', '', 1),
(40, 'Laura Marini', 'laura.jpg', 1),
(41, 'Laura Marini e Lorenzo Minno', '', 0),
(42, 'Niccol√≤ Minno', 'niccolo.jpg', 1),
(43, 'Simona Ferraro', '', 1),
(44, 'Simona e Simone Sbariggi', '', 0),
(45, 'Lorenzo Sbariggi', '', 1),
(46, 'Matteo Sbariggi', '', 1),
(47, 'Maurizio Ferrara', 'maurizio.png', 1),
(48, 'Martina Ferrara', 'martina_ferrara.png', 1),
(49, 'Francesco Ferrara', 'francesco_ferrara.png', 1),
(50, 'Alessandra Minno e Maurizio Ferrara', '', 0),
(51, 'Ezio', '', 1),
(52, 'Olga', '', 1),
(53, 'Ezio e Olga', '', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

CREATE TABLE IF NOT EXISTS `tags` (
  `document` int(11) NOT NULL,
  `node` int(11) NOT NULL,
  `position` point DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `tags`
--

INSERT INTO `tags` (`document`, `node`, `position`) VALUES
(0, 3, '\0\0\0\0\0\0\0\0\0\0\0\0`c@\0\0\0\0\0∏Ö@'),
(0, 18, '\0\0\0\0\0\0\0\0\0\0\0\0†i¿\0\0\0\0\0ê|@'),
(1, 0, NULL),
(1, 1, NULL),
(1, 3, '\0\0\0\0\0\0\0\0\0\0\0\0@X¿\0\0\0\0\0Äv@'),
(1, 4, NULL),
(2, 3, '\0\0\0\0\0\0\0\0\0\0\0\0\0@¿\0\0\0\0\0`z@'),
(2, 4, NULL),
(2, 18, NULL),
(2, 19, NULL),
(2, 30, NULL),
(3, 35, NULL),
(3, 3, '\0\0\0\0\0\0\0\0\0\0\0\0\06@\0\0\0\0\0–s@'),
(3, 4, NULL),
(3, 5, NULL),
(4, 3, '\0\0\0\0\0\0\0\0\0\0\0\0Ä`@\0\0\0\0\00x@'),
(4, 4, NULL),
(4, 18, NULL),
(4, 35, NULL),
(5, 3, '\0\0\0\0\0\0\0\0\0\0\0\0¿W@\0\0\0\0\0Ä}@'),
(5, 4, NULL),
(5, 18, NULL),
(5, 35, NULL),
(5, 40, NULL),
(5, 30, NULL),
(5, 19, NULL),
(6, 4, NULL),
(7, 4, NULL),
(8, 4, NULL),
(9, 4, NULL),
(10, 4, NULL),
(11, 4, NULL),
(12, 4, NULL),
(13, 4, NULL),
(14, 4, NULL),
(15, 4, NULL),
(16, 3, '\0\0\0\0\0\0\0\0\0\0\0\0x¿\0\0\0\0\0‡p@'),
(16, 16, NULL),
(17, 3, '\0\0\0\0\0\0\0\0\0\0\0\0†~@\0\0\0\0\0@z@'),
(17, 4, NULL),
(18, 5, NULL),
(19, 36, NULL),
(19, 47, NULL),
(19, 48, NULL),
(19, 49, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `views`
--

CREATE TABLE IF NOT EXISTS `views` (
  `user` int(11) NOT NULL,
  `view` int(11) NOT NULL,
  `node` int(11) NOT NULL,
  `x` int(11) NOT NULL,
  `y` int(11) NOT NULL,
  PRIMARY KEY (`user`,`view`,`node`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `views`
--

INSERT INTO `views` (`user`, `view`, `node`, `x`, `y`) VALUES
(0, 4, 0, 996, 245),
(0, 4, 1, 670, 383),
(3, 0, 3, 556, 345),
(3, 0, 4, 1243, 324),
(3, 1, 3, 593, 718),
(3, 1, 54, 675, 280),
(3, 4, 0, 842, 472),
(3, 4, 1, 1132, 456),
(3, 4, 2, 1017, 367),
(3, 4, 3, 372, 602),
(3, 4, 4, 1119, 214),
(3, 4, 5, 196, 850),
(3, 4, 6, 628, 831),
(3, 4, 8, 173, 323),
(3, 4, 9, 574, 269),
(3, 4, 10, 46, 513),
(3, 4, 11, 335, 227),
(3, 4, 12, 459, 86),
(3, 4, 13, 349, -72),
(3, 4, 14, 148, -71),
(3, 4, 15, 647, -144),
(3, 4, 16, -222, 576),
(3, 4, 18, -387, 348),
(3, 4, 19, -399, 161),
(3, 4, 20, -28, 219),
(3, 4, 21, -179, 47),
(3, 4, 22, 60, 102),
(3, 4, 23, 1174, 830),
(3, 4, 24, 1549, 827),
(3, 4, 28, 2121, 428),
(3, 4, 29, 1875, 325),
(3, 4, 30, 1802, 127),
(3, 4, 31, 2009, -42),
(3, 4, 32, 1913, -4),
(3, 4, 33, 1336, 271),
(3, 4, 34, 1452, 157),
(3, 4, 36, 1465, 57),
(3, 4, 37, -29, -38),
(3, 4, 38, -103, -97),
(3, 4, 39, -248, -228),
(3, 4, 40, 859, -31),
(3, 4, 41, 944, 84),
(3, 4, 43, 462, -124),
(3, 4, 44, 385, -130),
(3, 4, 45, 236, -258),
(3, 4, 46, 432, -269),
(3, 4, 47, 1321, -85),
(3, 4, 48, 1407, -201),
(3, 4, 50, 1431, -50),
(3, 4, 51, -341, 949),
(3, 4, 53, -440, 750),
(3, 4, 54, 2079, 240),
(3, 4, 55, 595, 98),
(3, 4, 56, 760, -4),
(10, 4, 5, 556, 960),
(10, 4, 6, 1129, 942),
(10, 4, 10, 879, 353),
(10, 4, 44, 1594, -17),
(15, 0, 13, 437, 530),
(15, 0, 15, 1338, 275),
(15, 4, 0, 632, 426),
(15, 4, 5, 633, 860),
(15, 4, 6, 1082, 860),
(15, 4, 9, 1056, 426),
(15, 4, 16, 1813, 488),
(15, 4, 21, -63, 82),
(15, 4, 37, -257, -63),
(15, 4, 38, -128, -57),
(15, 4, 39, -79, -179),
(15, 4, 44, 755, -37),
(16, 4, 16, 1159, 415),
(18, 4, 2, 627, 217),
(18, 4, 3, 434, 129),
(18, 4, 8, -85, 115),
(18, 4, 18, 1091, 87),
(18, 4, 20, -223, 345),
(18, 4, 22, -185, -95),
(19, 4, 0, 677, 388),
(19, 4, 1, 411, 437),
(19, 4, 2, 565, 255),
(19, 4, 5, 175, 932),
(19, 4, 6, 627, 931),
(19, 4, 11, -604, 538),
(19, 4, 12, -588, 385),
(19, 4, 13, -477, 169),
(19, 4, 16, 1213, 449),
(19, 4, 19, 989, 180),
(19, 4, 22, 101, 192),
(19, 4, 44, -459, 30),
(19, 4, 51, 1239, 919),
(19, 4, 52, 1585, 875),
(27, 4, 27, 1043, 429);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
