<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xlf="urn:oasis:names:tc:xliff:document:1.2" version="2.0">

  <xsl:output method="text" indent="no"/>
  <xsl:strip-space elements="*"/>

  <xsl:template match="/">
    <idcka>
      <xsl:apply-templates select="//xlf:trans-unit"/>
    </idcka>
  </xsl:template>

  <xsl:template match="xlf:trans-unit">
    <xsl:value-of select="@id"/>;;<xsl:value-of select="normalize-space(xlf:source)"/>;;<xsl:value-of select="normalize-space(xlf:target)"/><xsl:text>&#xD;</xsl:text>
  </xsl:template>

</xsl:stylesheet>
