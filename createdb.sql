CREATE DATABASE scentia;
USE scentia;

-- MySQL dump 10.13  Distrib 5.7.42, for Linux (x86_64)
--
-- Host: localhost    Database: mydb
-- ------------------------------------------------------
-- Server version	5.7.42-0ubuntu0.18.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category` (
  `id` int(11) DEFAULT NULL,
  `name` varchar(65) DEFAULT NULL,
  `image` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `client_details`
--

DROP TABLE IF EXISTS `client_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `client_details` (
  `id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `consumer_id` int(11) DEFAULT NULL,
  `fragnence_id` int(11) DEFAULT NULL,
  `company_name` varchar(65) DEFAULT NULL,
  `industry` varchar(65) DEFAULT NULL,
  `brand_vision` text,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `consumer_details`
--

DROP TABLE IF EXISTS `consumer_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `consumer_details` (
  `id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `mkt_loc` varchar(65) DEFAULT NULL,
  `age_gp` varchar(65) DEFAULT NULL,
  `gender` varchar(65) DEFAULT NULL,
  `tg_user_occup` varchar(65) DEFAULT NULL,
  `tg_user_style` varchar(65) DEFAULT NULL,
  `tg_user_behav` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fragrance_colors`
--

DROP TABLE IF EXISTS `fragrance_colors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fragrance_colors` (
  `id` int(11) DEFAULT NULL,
  `name` varchar(65) DEFAULT NULL,
  `image` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fragrance_details`
--

DROP TABLE IF EXISTS `fragrance_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fragrance_details` (
  `id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `smell` varchar(65) DEFAULT NULL,
  `olfactive_dir` varchar(65) DEFAULT NULL,
  `ingredients` varchar(65) DEFAULT NULL,
  `emotions` varchar(65) DEFAULT NULL,
  `colors` varchar(65) DEFAULT NULL,
  `dosage` varchar(65) DEFAULT NULL,
  `price_range` varchar(65) DEFAULT NULL,
  `ref_link` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fragrance_emotions`
--

DROP TABLE IF EXISTS `fragrance_emotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fragrance_emotions` (
  `id` int(11) DEFAULT NULL,
  `name` varchar(65) DEFAULT NULL,
  `image` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fragrance_ingredients`
--

DROP TABLE IF EXISTS `fragrance_ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fragrance_ingredients` (
  `id` int(11) DEFAULT NULL,
  `name` varchar(65) DEFAULT NULL,
  `image` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fragrance_olfa_dir`
--

DROP TABLE IF EXISTS `fragrance_olfa_dir`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fragrance_olfa_dir` (
  `id` int(11) DEFAULT NULL,
  `name` varchar(65) DEFAULT NULL,
  `image` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fragrance_smell`
--

DROP TABLE IF EXISTS `fragrance_smell`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fragrance_smell` (
  `id` int(11) DEFAULT NULL,
  `name` varchar(65) DEFAULT NULL,
  `image` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_details`
--

DROP TABLE IF EXISTS `product_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_details` (
  `id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(65) DEFAULT NULL,
  `size` varchar(65) DEFAULT NULL,
  `price` varchar(65) DEFAULT NULL,
  `benchmark` varchar(65) DEFAULT NULL,
  `web_link` varchar(65) DEFAULT NULL,
  `category` varchar(65) DEFAULT NULL,
  `type` varchar(65) DEFAULT NULL,
  `packaging` varchar(65) DEFAULT NULL,
  `formate` varchar(65) DEFAULT NULL,
  `market` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_formate`
--

DROP TABLE IF EXISTS `product_formate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_formate` (
  `id` int(11) DEFAULT NULL,
  `name` varchar(65) DEFAULT NULL,
  `image` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_market`
--

DROP TABLE IF EXISTS `product_market`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_market` (
  `id` int(11) DEFAULT NULL,
  `name` varchar(65) DEFAULT NULL,
  `image` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_packaging`
--

DROP TABLE IF EXISTS `product_packaging`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_packaging` (
  `id` int(11) DEFAULT NULL,
  `name` varchar(65) DEFAULT NULL,
  `image` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_types`
--

DROP TABLE IF EXISTS `product_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_types` (
  `id` int(11) DEFAULT NULL,
  `name` varchar(65) DEFAULT NULL,
  `image` varchar(65) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-12-18 17:12:41
